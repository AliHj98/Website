import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Screen texture data URL - Simplified Kali Linux interface
const kaliScreenTexture = `data:image/svg+xml,${encodeURIComponent(`
<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg">
    <!-- Dark background -->
    <rect width="100%" height="100%" fill="#1a1a1a"/>
    
    <!-- Top bar -->
    <rect width="100%" height="20" fill="#2b2b2b"/>
    <circle cx="15" cy="10" r="5" fill="#ff5f56"/>
    <circle cx="35" cy="10" r="5" fill="#ffbd2e"/>
    <circle cx="55" cy="10" r="5" fill="#27c93f"/>
    
    <!-- Kali dragon logo -->
    <text x="480" y="16" fill="#1793d1" font-size="14">龍</text>
    
    <!-- Terminal window -->
    <rect x="10" y="30" width="492" height="150" fill="#000000" rx="3"/>
    <text x="20" y="50" fill="#00ff00" font-family="monospace">┌──(kali㉿kali)-[~]</text>
    <text x="20" y="70" fill="#00ff00" font-family="monospace">└─$ nmap -sV 192.168.1.1</text>
    <text x="20" y="90" fill="#ffffff" font-family="monospace">Starting Nmap 7.93 ...</text>
    
    <!-- Tool icons -->
    <rect x="10" y="190" width="40" height="40" fill="#333333" rx="5"/>
    <text x="20" y="215" fill="#ffffff">⚡</text>
    
    <rect x="60" y="190" width="40" height="40" fill="#333333" rx="5"/>
    <text x="70" y="215" fill="#ffffff">🌐</text>
    
    <rect x="110" y="190" width="40" height="40" fill="#333333" rx="5"/>
    <text x="120" y="215" fill="#ffffff">🔒</text>
</svg>
`)}`;

// Initialize scene
function init() {
    const container = document.getElementById('classroom-scene');
    const containerRect = container.getBoundingClientRect();
    
    renderer.setSize(containerRect.width, containerRect.height);
    container.appendChild(renderer.domElement);
    
    // Set background to transparent
    renderer.setClearColor(0x000000, 0);
    
    // Camera position
    camera.position.z = 12;
    camera.position.y = 3;
    camera.position.x = 0;
    camera.lookAt(0, 1, -3);

    // Lighting setup
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Ceiling lights
    const ceilingLights = [
        { x: -3, z: -2 },
        { x: 0, z: -2 },
        { x: 3, z: -2 },
        { x: -3, z: -5 },
        { x: 0, z: -5 },
        { x: 3, z: -5 }
    ];

    ceilingLights.forEach(pos => {
        // Light fixture
        const fixtureGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const fixtureMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            emissive: 0xcccccc,
            emissiveIntensity: 0.2
        });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.set(pos.x, 3.9, pos.z);
        fixture.castShadow = true;
        scene.add(fixture);

        // Spotlight
        const spotlight = new THREE.SpotLight(0xffffff, 1);
        spotlight.position.set(pos.x, 3.8, pos.z);
        spotlight.target.position.set(pos.x, 0, pos.z);
        spotlight.angle = Math.PI / 4;
        spotlight.penumbra = 0.3;
        spotlight.decay = 1;
        spotlight.distance = 10;
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;
        spotlight.shadow.camera.near = 0.5;
        spotlight.shadow.camera.far = 15;
        scene.add(spotlight);
        scene.add(spotlight.target);
    });

    // Create classroom elements
    createClassroom();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function createClassroom() {
    // Room
    const roomWidth = 12;
    const roomHeight = 4;
    const roomLength = 15;
    
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomLength);
    const roomMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x404040,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3
    });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.y = roomHeight/2;
    room.receiveShadow = true;
    scene.add(room);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x303030,
        shininess: 50
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor grid
    const gridHelper = new THREE.GridHelper(roomWidth, 12, 0x808080, 0x808080);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Desks - Three rows of three desks
    for (let row = 0; row < 3; row++) {
        for (let col = -1; col <= 1; col++) {
            createDesk(col * 2.5, -2 + (row * 3));
        }
    }

    // Screens on walls
    createScreen(-5.9, 1.5, -5, Math.PI / 2);  // Left wall
    createScreen(5.9, 1.5, -5, -Math.PI / 2);  // Right wall
    createMainScreen(0, 1.5, -7.4, 0);  // Front wall - special presentation screen

    // Server racks along side walls only
    createServerRack(-5.9, 0, -2);
    createServerRack(5.9, 0, -2);

    // Create professor with pacing animation
    const professorStartX = -3;
    const professorEndX = 3;
    createProfessor(professorStartX, -6);
}

function createDesk(x, z) {
    // Desktop
    const deskGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.8);
    const deskMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, 0.5, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);

    // Monitor
    const monitorGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
    const monitorMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(x, 1.0, z);
    monitor.castShadow = true;
    monitor.receiveShadow = true;
    scene.add(monitor);

    // Keyboard
    const keyboardGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
    const keyboardMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(x, 0.55, z + 0.2);
    keyboard.castShadow = true;
    keyboard.receiveShadow = true;
    scene.add(keyboard);

    // Keyboard keys (simplified)
    const keysGeometry = new THREE.PlaneGeometry(0.75, 0.25);
    const keysMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        side: THREE.DoubleSide
    });
    const keys = new THREE.Mesh(keysGeometry, keysMaterial);
    keys.rotation.x = -Math.PI / 2;
    keys.position.set(x, 0.53, z + 0.2);
    keys.receiveShadow = true;
    scene.add(keys);

    // Screen content
    const screenGeometry = new THREE.PlaneGeometry(0.55, 0.35);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(x, 1.0, z + 0.03);
    
    // Load Kali GUI texture for student monitors
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(kaliScreenTexture);
    screenMaterial.map = texture;
    screenMaterial.emissiveMap = texture;
    
    scene.add(screen);

    // Chair
    createChair(x, z + 1.0);

    // Student
    createStudent(x, z + 0.8);
}

function createScreen(x, y, z, rotation) {
    // Screen frame
    const frameGeometry = new THREE.BoxGeometry(3, 1.8, 0.1);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    frame.rotation.y = rotation;
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);

    // Screen content
    const screenGeometry = new THREE.PlaneGeometry(2.9, 1.7);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(
        x + (rotation ? Math.sin(rotation) * 0.06 : 0),
        y,
        z + (rotation ? Math.cos(rotation) * 0.06 : -0.06)
    );
    screen.rotation.y = rotation;

    // Load Kali GUI texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(kaliScreenTexture);
    screenMaterial.map = texture;
    screenMaterial.emissiveMap = texture;
    
    scene.add(screen);
}

function createMainScreen(x, y, z, rotation) {
    // Main screen frame
    const frameGeometry = new THREE.BoxGeometry(4, 2.4, 0.1);
    const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x000000
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    frame.rotation.y = rotation;
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);

    // Screen content
    const screenGeometry = new THREE.PlaneGeometry(3.8, 2.2);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(x, y, z - 0.06);
    screen.rotation.y = rotation;
    scene.add(screen);

    // Create and load Kali GUI texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(kaliScreenTexture);
    screenMaterial.map = texture;
    screenMaterial.emissiveMap = texture;
    screenMaterial.emissiveIntensity = 0.5;
}

function createStudent(x, z) {
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 0.8, z);
    body.castShadow = true;
    scene.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xe8beac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 1.3, z);
    head.castShadow = true;
    scene.add(head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(x - 0.25, 0.9, z);
    leftArm.rotation.z = -0.3;
    leftArm.castShadow = true;
    scene.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(x + 0.25, 0.9, z);
    rightArm.rotation.z = 0.3;
    rightArm.castShadow = true;
    scene.add(rightArm);

    // Laptop
    const laptopBaseGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.2);
    const laptopScreenGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.01);
    const laptopMaterial = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });
    
    const laptopBase = new THREE.Mesh(laptopBaseGeometry, laptopMaterial);
    laptopBase.position.set(x, 0.6, z - 0.1);
    laptopBase.castShadow = true;
    laptopBase.receiveShadow = true;
    scene.add(laptopBase);
    
    const laptopScreen = new THREE.Mesh(laptopScreenGeometry, laptopMaterial);
    laptopScreen.position.set(x, 0.7, z - 0.2);
    laptopScreen.rotation.x = -0.3;
    laptopScreen.castShadow = true;
    laptopScreen.receiveShadow = true;
    scene.add(laptopScreen);
}

function createProfessor(x, z) {
    // Group to hold all professor parts for animation
    const professorGroup = new THREE.Group();
    scene.add(professorGroup);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    professorGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xe8beac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    professorGroup.add(head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.12);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.31, 1.2, 0);
    leftArm.castShadow = true;
    professorGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.31, 1.2, 0);
    rightArm.castShadow = true;
    professorGroup.add(rightArm);

    // Position the entire professor and set up pacing animation
    professorGroup.position.set(x, 0, z);

    // Add to animation loop
    function animateProfessor() {
        const time = Date.now() * 0.001;
        
        // Pacing motion
        const pacePosition = Math.sin(time * 0.5) * 3; // Move 3 units left and right
        professorGroup.position.x = x + pacePosition;
        
        // Walking animation
        professorGroup.rotation.y = Math.sin(time) * 0.1;
        
        // Arm movement synchronized with walking
        leftArm.rotation.z = Math.sin(time * 2) * 0.3;
        rightArm.rotation.z = -Math.sin(time * 2) * 0.3;
        
        // Slight body bob
        professorGroup.position.y = Math.sin(time * 4) * 0.05;
    }

    // Add to animation functions array
    animationFunctions.push(animateProfessor);
}

function createChair(x, z) {
    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
    const chairMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.position.set(x, 0.35, z);
    seat.castShadow = true;
    seat.receiveShadow = true;
    scene.add(seat);

    // Back
    const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.1);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.position.set(x, 0.65, z + 0.2);
    back.rotation.x = Math.PI * 0.1;
    back.castShadow = true;
    back.receiveShadow = true;
    scene.add(back);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            const leg = new THREE.Mesh(legGeometry, chairMaterial);
            leg.position.set(x + (i * 0.2), 0.15, z + (j * 0.2));
            leg.castShadow = true;
            leg.receiveShadow = true;
            scene.add(leg);
        }
    }
}

function createServerRack(x, y, z) {
    const rackGeometry = new THREE.BoxGeometry(0.8, 2, 0.6);
    const rackMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(x, y + 1, z);
    rack.castShadow = true;
    rack.receiveShadow = true;
    scene.add(rack);

    // Add blinking lights
    for (let i = 0; i < 5; i++) {
        const lightGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const lightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: Math.random()
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(x + 0.3, y + 0.5 + (i * 0.3), z + 0.31);
        light.castShadow = true;
        scene.add(light);
    }
}

function onWindowResize() {
    const container = document.getElementById('classroom-scene');
    const containerRect = container.getBoundingClientRect();
    
    camera.aspect = containerRect.width / containerRect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(containerRect.width, containerRect.height);
}

// Mouse interaction variables
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let isMouseDown = false;

// Array to store animation functions
const animationFunctions = [];

// Add mouse event listeners
function addMouseListeners() {
    const container = document.getElementById('classroom-scene');
    
    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onMouseWheel, { passive: false });
    
    // Prevent scrolling when mouse is over the container
    container.addEventListener('mouseenter', () => {
        document.body.style.overflow = 'hidden';
    });
    
    container.addEventListener('mouseleave', () => {
        document.body.style.overflow = 'auto';
    });
}

function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseMove(event) {
    if (!isMouseDown) return;
    
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;
    
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    targetRotationY += deltaX * 0.01;
    targetRotationX += deltaY * 0.01;
    
    // Limit vertical rotation
    targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationX));
}

function onMouseUp() {
    isMouseDown = false;
}

function onMouseWheel(event) {
    event.preventDefault();  // Prevent page scrolling
    
    const delta = Math.sign(event.deltaY);
    const newPosition = camera.position.length() + delta;
    
    // Limit zoom between 5 and 15
    if (newPosition > 5 && newPosition < 15) {
        camera.position.setLength(newPosition);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update camera position based on target rotation
    const radius = camera.position.length();
    camera.position.x = radius * Math.sin(targetRotationY) * Math.cos(targetRotationX);
    camera.position.z = radius * Math.cos(targetRotationY) * Math.cos(targetRotationX);
    camera.position.y = radius * Math.sin(targetRotationX);
    
    camera.lookAt(0, 1, -3);  // Look at the center of the room

    // Run all animation functions
    animationFunctions.forEach(fn => fn());
    
    renderer.render(scene, camera);
}

// Initialize and start animation when the page loads
window.addEventListener('load', () => {
    init();
    addMouseListeners();
    animate();
});
