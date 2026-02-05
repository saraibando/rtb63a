import * as THREE from 'three';

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x011402);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 5;

const myImages = [
  "https://res.cloudinary.com/dqinmqte8/image/upload/v1770052396/IMG_0942_doczm9.jpg",
  "https://res.cloudinary.com/dqinmqte8/image/upload/v1770052386/IMG_0963_ltihom.jpg",
  "https://res.cloudinary.com/dqinmqte8/image/upload/v1770052396/IMG_0940_npf5lk.jpg",
  "https://res.cloudinary.com/dqinmqte8/image/upload/v1770052390/IMG_0951_fe8wie.jpg",
  "https://res.cloudinary.com/dqinmqte8/image/upload/v1770052389/IMG_0956_bdypja.jpg"
];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-100,-100)

const bgGeometry = new THREE.PlaneGeometry (1,1);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: null,
  transparent: true,
  opacity: 0
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);

bgMesh.position.z = -1;

scene.add(bgMesh);

const updateBackgroundSize = () => {
  const dist = camera.position.z - bgMesh.position.z;
  const height = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * dist;
  const width = height * camera.aspect;
  bgMesh.scale.set(width, height, 1);
};

updateBackgroundSize();

window.addEventListener("resize", updateBackgroundSize);

const settings = {
  wheelSensitivity: 0.005,
  touchSensitivity: 0.01,
  momentumMultiplier: 2,
  smoothing: 0.1,
  slideLerp: 0.075,
  distorsionDecay: 0.95,
  maxDistorsion: 0.5,
  distorsionSensitivity: 0.15,
  distorsionSmoothing: 0.075,
};

const slideWidth = 1.5;
const slideHeight = 0.75;
const gap = 0.1;
const imagesCount = myImages.length;
const slideCount = 15;
const totalWidth = slideCount * (slideWidth + gap);
const slideUnit = slideWidth + gap;

const slides = [];
let currentPosition = 0;
let targetPosition = 0;
let isScrolling = false;
let autoScrollSpeed = 0;
let lastTime = 0;
let touchStartX = 0;
let touchLastX = 0;
let prevPosition = 0;

let currentDistorsionFactor = 0;
let targetDistorsionFactor = 0;
let peakVelocity = 0;
let velocityHistory = [0, 0, 0, 0, 0];
let currentHoverIndex = -1;

const correctImageColor = (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createSlide = (index) => {
  const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight, 32, 16);

  //const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"];
  //const material = new THREE.MeshBasicMaterial({
  //  color: new THREE.Color(colors[index % colors.length]),
  //  side: THREE.DoubleSide,
  //});
  const material = new THREE.ShaderMaterial({
    uniforms:{
      uTexture: {value: null },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
    uniform sampler2D uTexture;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(uTexture, vUv);
      float gray = dot(color.rgb, vec3(0.120, 0.587, 0.114));
      vec3 darkColor = vec3(0.004, 0.078, 0.008);
      vec3 lightColor = vec3(0.941, 1.0, 0.941);
      vec3 finalColor = mix(darkColor, lightColor, gray);
      gl_FragColor = vec4(finalColor, color.a);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry,material);
  mesh.position.x = index * (slideWidth + gap);
  mesh.userData = {
    originalVertices: [...geometry.attributes.position.array],
    index,
  };

  //const imageIndex = (index % imagesCount) + 1;
  //const imagePath = `${imageIndex}.JPG`;

  const imageURL = myImages[index % myImages.length];

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  loader.load(
    imageURL,
    (texture) => {
      correctImageColor(texture);
      material.uniforms.uTexture.value = texture;
      material.map = texture;
      //material.color.set(0xffffff);
      //material.needsUpdate = true;

      const imgAspect = texture.image.width / texture.image.height;
      const slideAspect = slideWidth / slideHeight;

      if (imgAspect > slideAspect) {
        mesh.scale.y = slideAspect / imgAspect
      } else {
        mesh.scale.x = imgAspect / slideAspect
      }
    },
    undefined,
    (err) => console.warn(`Couldn't load image ${imageURL}`, err)
  );

  scene.add(mesh);
  slides.push(mesh);
};

for (let i=0; i < slideCount; i++) {
  createSlide(i);
}

slides.forEach((slide) => {
  slide.position.x -= totalWidth / 2;
  slide.userData.targetX = slide.position.x;
  slide.userData.currentX = slide.position.x;
});

const updateCurve = (mesh, worldPositionX, distorsionFactor) => {
  const distorsionCenter = new THREE.Vector2(0, 0);
  const distorsionRadius = 2.0;
  const maxCurvature = settings.maxDistorsion * distorsionFactor;

  const positionAttribute = mesh.geometry.attributes.position;
  const originalVertices = mesh.userData.originalVertices;

  for ( let i = 0; i < positionAttribute.count; i++) {
    const x = originalVertices[i * 3];
    const y = originalVertices[i * 3 + 1];

    const vertexWorldPosX = worldPositionX + x;
    const distFromCenter = Math.sqrt(
      Math.pow(y - distorsionCenter.y, 2)
    );

    const distorsionStrength = Math.max(
      0,
      1 - distFromCenter / distorsionRadius
    );
    const curveZ =
      Math.pow(Math.sin((distorsionStrength * Math.PI) /2), 1.5) *
      maxCurvature;

      positionAttribute.setZ(i, curveZ);
  }

  positionAttribute.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
};

window.addEventListener("keydown", (e) =>{
  if (e.key == "ArrowLeft") {
    targetPosition += slideUnit;
    targetDistorsionFactor = Math.min(1.0, targetDistorsionFactor + 0.3);
  } else if (e.key == "ArrowRight") {
    targetPosition -= slideUnit;
    targetDistorsionFactor = Math.min(1.0, targetDistorsionFactor + 0.3);
  }
});

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const wheelStrength = Math.abs(e.deltaY) * 0.001;
    targetDistorsionFactor = Math.min(
      1.0,
      targetDistorsionFactor + wheelStrength
    );

    targetPosition -= e.deltaY * settings.wheelSensitivity;
    isScrolling = true;
    autoScrollSpeed =
      Math.min(Math.abs(e.deltaY) * 0.0005, 0.05) * Math.sign(e.deltaY);

    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  },
  {passive: false }
);

window.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchLastX = touchStartX;
    isScrolling = false;
  },
  {passive: false }
);

window.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchLastX;
    touchLastX = touchX;

    const touchStrength = Math.abs(deltaX) * 0.02;
    targetDistorsionFactor = Math.min(
      1.0,
      targetDistorsionFactor + touchStrength
    );

    targetPosition -= deltaX * settings.touchSensitivity;
    isScrolling = true;
  },
  { passive: false }
);

window.addEventListener("touchend", () => {
  const velocity = (touchLastX - touchStartX) * 0.005;
  if (Math.abs(velocity) > 0.5) {
    autoScrollSpeed = -velocity * settings.momentumMultiplier * 0.05;
    targetDistorsionFactor = Math.min(
      1.0,
      Math.abs(velocity * 3 * settings.distorsionSensitivity)
    );
    isScrolling = true;
    setTimeout(() => {
      isScrolling = false;
    }, 800);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight)
});

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

let animationId;
let isPaused = false;

const animate = (time) => {

  if (isPaused) return;
  
  animationId = requestAnimationFrame(animate);

  const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
  lastTime = time;

  const prevPos = currentPosition;

  if (isScrolling) {
    targetPosition += autoScrollSpeed;
    const speedBasedDecay = 0.97 - Math.abs(autoScrollSpeed) * 0.5;
    autoScrollSpeed *= Math.max(0.92, speedBasedDecay);

    if (Math.abs(autoScrollSpeed) < 0.001) {
      autoScrollSpeed = 0;
    }
  }

  currentPosition += (targetPosition - currentPosition) * settings.smoothing;

  const currentVelocity = Math.abs(currentPosition - prevPos) / deltaTime;
  velocityHistory.push(currentVelocity);
  velocityHistory.shift();

  const avgVelocity =
    velocityHistory.reduce((sum, val) => sum + val, 0) / velocityHistory.length;

    if (avgVelocity > peakVelocity) {
      peakVelocity = avgVelocity;
    }

    const velocityRatio = avgVelocity / (peakVelocity + 0.01);
    const isDecelerating = velocityRatio < 0.7 && peakVelocity > 0.5;
    
    peakVelocity *= 0.99;

    const movementDistorsion = Math.min(1.0, currentVelocity * 0.1);
    if (currentVelocity > 0.05) {
      targetDistorsionFactor = Math.max(
        targetDistorsionFactor,
        movementDistorsion
      );
    }

    if (isDecelerating || avgVelocity < 0.2) {
      const decayRate = isDecelerating
        ? settings.distorsionDecay
        : settings.distorsionDecay * 0.9;
      targetDistorsionFactor *= decayRate;
    }

    currentDistorsionFactor +=
      (targetDistorsionFactor - currentDistorsionFactor) *
      settings.distorsionSmoothing;

      slides.forEach((slide, i) => {
        let baseX = i * slideUnit - currentPosition;
        baseX = ((baseX % totalWidth) + totalWidth) % totalWidth;

        if (baseX > totalWidth / 2) {
          baseX -= totalWidth;
        }

        const isWrapping =
          Math.abs(baseX - slide.userData.targetX) > slideWidth * 2;
        if (isWrapping) {
          slide.userData.currentX = baseX;
        }

        slide.userData.targetX = baseX;
        slide.userData.currentX +=
          (slide.userData.targetX - slide.userData.currentX) * settings.slideLerp;

        const wrapThereshold = totalWidth / 2 + slideWidth;
        if (Math.abs(slide.userData.currentX) < wrapThereshold * 1.5) {
          slide.position.x = slide.userData.currentX;
          //updateCurve(slide, slide.position.x, currentDistorsionFactor);
        }
      });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(slides);

      if (intersects.length > 0) {
        const hoveredObj = intersects[0].object;
        const hoveredIndex = hoveredObj.userData.index;

        const texture = hoveredObj.material.map;

        if (currentHoverIndex !== hoveredIndex && texture) {
          currentHoverIndex = hoveredIndex;
          bgMesh.material.map = texture;
          bgMesh.material.needsUpdate = true;
          if (bgMesh.material.map) bgMesh.material.map.needsUpdate = true;

          gsap.killTweensOf(bgMesh.material);
          gsap.to(bgMesh.material, {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
          });
        }
      } else{
        if (currentHoverIndex !== -1) {
          currentHoverIndex = -1;

          gsap.killTweensOf(bgMesh.material);
          gsap.to(bgMesh.material, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
              if(currentHoverIndex == -1) {
                bgMesh.material.map = null;
                bgMesh.material.needsUpdate = true;
              }
            }
          });
        }
      }

        renderer.render(scene, camera);
};

animate();

window.addEventListener('stop-threejs', () => {
  if (!isPaused) {
    isPaused = true;
    cancelAnimationFrame(animationId);
    canvas.style.display = 'none';
  }
});

window.addEventListener('start-threejs',() => {
  if (isPaused) {
    canvas.style.display = 'block';
    isPaused = false;
    lastTime = 0;
    animate();
  }
});

