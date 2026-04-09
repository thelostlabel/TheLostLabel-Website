const particleField = document.getElementById("particle-field");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (particleField && !prefersReducedMotion) {
  const particles = [];
  const particleCount = 72;

  for (let index = 0; index < particleCount; index += 1) {
    const element = document.createElement("span");
    element.className = "particle";
    particleField.appendChild(element);

    particles.push({
      element,
      angle: Math.random() * Math.PI * 2,
      radius: 90 + Math.random() * 360,
      spin: 0.002 + Math.random() * 0.01,
      pull: 0.08 + Math.random() * 0.24,
      drift: (Math.random() - 0.5) * 0.28,
      scale: 0.35 + Math.random() * 1.5,
      size: 1.8 + Math.random() * 5.4,
      opacity: 0.35 + Math.random() * 0.65,
    });
  }

  const render = () => {
    const bounds = particleField.getBoundingClientRect();
    const aspectY = bounds.height / bounds.width;

    particles.forEach((particle, index) => {
      particle.angle += particle.spin + particle.radius * 0.000012;
      particle.radius -= particle.pull;

      if (particle.radius <= 52) {
        particle.radius = 180 + Math.random() * 340;
        particle.angle = Math.random() * Math.PI * 2;
        particle.spin = 0.002 + Math.random() * 0.01;
        particle.pull = 0.08 + Math.random() * 0.24;
        particle.scale = 0.35 + Math.random() * 1.5;
        particle.opacity = 0.35 + Math.random() * 0.65;
      }

      const orbitSquash = 0.34 + (particle.radius / 540) * 0.44;
      const x = Math.cos(particle.angle + particle.drift) * particle.radius;
      const y = Math.sin(particle.angle) * particle.radius * orbitSquash * aspectY;
      const stretch = 0.72 + Math.sin(particle.angle * 2 + index) * 0.18;

      particle.element.style.setProperty("--x", `${x}px`);
      particle.element.style.setProperty("--y", `${y}px`);
      particle.element.style.setProperty("--scale", `${particle.scale * stretch}`);
      particle.element.style.setProperty("--size", `${particle.size}px`);
      particle.element.style.setProperty("--opacity", `${particle.opacity}`);
    });

    window.requestAnimationFrame(render);
  };

  window.requestAnimationFrame(render);
}
