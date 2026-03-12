const INVITATION_CONFIG = {
  quinceanera: "Evelyn Nayely Alfonso González",
  eventDate: "2025-10-12T19:00:00",
  drivePhotosUrl: "https://drive.google.com/",
  driveAlbumUrl: "https://drive.google.com/",
  rsvpFormUrl: "https://docs.google.com/forms/",
  desktopMinWidth: 900,
};

let audioEnabled = false;
let introDismissed = false;
let storyIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  initMobileOnlyGate();
  initIntroExperience();
  initCountdown();
  initMusicControls();
  initRSVPForm();
  initStorySlider();
  initInlineVideos();
  initMagicStars();
  applyDynamicLinks();
});

// SOLO CELULAR
function initMobileOnlyGate() {
  const blocker = document.getElementById("desktopBlocker");
  if (!blocker) return;

  const isMobileLike =
    /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(
      navigator.userAgent,
    ) || window.innerWidth < INVITATION_CONFIG.desktopMinWidth;

  if (isMobileLike) {
    blocker.style.display = "none";
  } else {
    blocker.style.display = "flex";
    document.body.classList.add("desktop-locked");
  }
}

// INTRO + VIDEO + SONIDO
function initIntroExperience() {
  const introOverlay = document.getElementById("introOverlay");
  const enterBtn = document.getElementById("enterInvitationBtn");
  const enableSoundBtn = document.getElementById("enableSoundBtn");
  const introVideo = document.getElementById("introVideo");
  const introVideoWrapper = document.getElementById("introVideoWrapper");

  if (
    !introOverlay ||
    !enterBtn ||
    !introVideo ||
    !enableSoundBtn ||
    !introVideoWrapper
  )
    return;

  safePlayVideo(introVideo);

  async function activateIntroSound() {
    if (audioEnabled) return;

    try {
      audioEnabled = true;

      introVideo.pause();
      introVideo.currentTime = 0;
      introVideo.muted = false;
      introVideo.volume = 1;

      await introVideo.play();

      enableSoundBtn.classList.add("hidden");
    } catch (error) {
      console.warn("No se pudo activar sonido en el video:", error);
      audioEnabled = false;
    }
  }

  enableSoundBtn.addEventListener("click", activateIntroSound);
  introVideoWrapper.addEventListener("click", activateIntroSound);

  enterBtn.addEventListener("click", () => {
    if (introDismissed) return;
    introDismissed = true;

    introOverlay.classList.add("intro-overlay--hidden");

    setTimeout(() => {
      introOverlay.style.display = "none";
    }, 650);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !introDismissed) {
      if (audioEnabled) {
        introVideo.play().catch(() => {});
      } else {
        safePlayVideo(introVideo);
      }
    }
  });
}
async function safePlayVideo(videoEl) {
  try {
    videoEl.muted = true;
    videoEl.setAttribute("muted", "");
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");

    await videoEl.play();
  } catch (error) {
    console.warn("No se pudo reproducir automáticamente el video:", error);
  }
}

// MÚSICA
function initMusicControls() {
  const toggleMusicBtn = document.getElementById("toggleMusicBtn");
  const bgMusic = document.getElementById("bgMusic");

  if (!toggleMusicBtn || !bgMusic) return;

  toggleMusicBtn.addEventListener("click", async () => {
    try {
      if (bgMusic.paused) {
        await bgMusic.play();
        updateMusicButtonState(true);
      } else {
        bgMusic.pause();
        updateMusicButtonState(false);
      }
    } catch (error) {
      console.error("Error al reproducir la música:", error);
    }
  });
}

function updateMusicButtonState(isPlaying) {
  const toggleMusicBtn = document.getElementById("toggleMusicBtn");
  if (!toggleMusicBtn) return;

  toggleMusicBtn.textContent = isPlaying
    ? "⏸ Pausar música"
    : "🎵 Reproducir música";
}

// CONTADOR
function initCountdown() {
  const eventDate = new Date(INVITATION_CONFIG.eventDate);

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateCountdown() {
    const now = new Date();
    const diff = eventDate - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// RSVP
function initRSVPForm() {
  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpSuccessMsg = document.getElementById("rsvpSuccessMsg");

  if (!rsvpForm || !rsvpSuccessMsg) return;

  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(rsvpForm);
    const guestName = formData.get("guestName") || "Invitado";
    const guestCount = formData.get("guestCount") || "0";
    const attendance = formData.get("attendance") || "";
    const message = formData.get("message") || "";

    const payload = {
      guestName,
      guestCount,
      attendance,
      message,
      createdAt: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem("xv_rsvp_list") || "[]");
    saved.push(payload);
    localStorage.setItem("xv_rsvp_list", JSON.stringify(saved));

    if (attendance === "si") {
      rsvpSuccessMsg.textContent = `¡Gracias, ${guestName}! ✨ Tu confirmación fue registrada.`;
    } else {
      rsvpSuccessMsg.textContent = `Gracias por avisarnos, ${guestName}. 💌`;
    }

    rsvpSuccessMsg.style.display = "block";
    rsvpForm.reset();

    console.log("RSVP guardado localmente:", payload);
  });
}

// CARRUSEL
function initStorySlider() {
  const track = document.getElementById("storyTrack");
  const prevBtn = document.getElementById("storyPrev");
  const nextBtn = document.getElementById("storyNext");
  const dotsContainer = document.getElementById("storyDots");

  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const slides = Array.from(track.children);

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "story-dot";
    if (index === 0) dot.classList.add("active");

    dot.addEventListener("click", () => {
      storyIndex = index;
      updateStorySlider();
    });

    dotsContainer.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => {
    storyIndex = storyIndex > 0 ? storyIndex - 1 : slides.length - 1;
    updateStorySlider();
  });

  nextBtn.addEventListener("click", () => {
    storyIndex = storyIndex < slides.length - 1 ? storyIndex + 1 : 0;
    updateStorySlider();
  });

  let startX = 0;
  let currentX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );

  track.addEventListener(
    "touchmove",
    (e) => {
      currentX = e.touches[0].clientX;
    },
    { passive: true },
  );

  track.addEventListener("touchend", () => {
    const diff = startX - currentX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        storyIndex = storyIndex < slides.length - 1 ? storyIndex + 1 : 0;
      } else {
        storyIndex = storyIndex > 0 ? storyIndex - 1 : slides.length - 1;
      }
      updateStorySlider();
    }

    startX = 0;
    currentX = 0;
  });

  function updateStorySlider() {
    track.style.transform = `translateX(-${storyIndex * 100}%)`;

    const dots = dotsContainer.querySelectorAll(".story-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === storyIndex);
    });

    updateCarouselVideos();
  }

  updateCarouselVideos();
}

// VIDEOS EN CARRUSEL Y EN HISTORIA
function initInlineVideos() {
  const autoVideos = document.querySelectorAll(".inline-story-video");

  autoVideos.forEach((video) => {
    safePlayInlineVideo(video);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const media = entry.target;

        if (media.tagName === "VIDEO") {
          if (entry.isIntersecting) {
            safePlayInlineVideo(media);
          } else {
            media.pause();
          }
        }
      });
    },
    { threshold: 0.45 },
  );

  autoVideos.forEach((video) => observer.observe(video));

  const featuredVideo = document.querySelector(".featured-video");
  if (featuredVideo) {
    featuredVideo.addEventListener("play", () => {
      const bgMusic = document.getElementById("bgMusic");
      if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        updateMusicButtonState(false);
      }
    });
  }
}

async function safePlayInlineVideo(videoEl) {
  if (!videoEl) return;

  try {
    videoEl.muted = true;
    videoEl.setAttribute("muted", "");
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    await videoEl.play();
  } catch (error) {
    console.warn("No se pudo reproducir video inline:", error);
  }
}

function updateCarouselVideos() {
  const slides = document.querySelectorAll(".story-slide");
  const videos = document.querySelectorAll(".carousel-video");

  videos.forEach((video) => video.pause());

  const activeSlide = slides[storyIndex];
  if (!activeSlide) return;

  const activeVideo = activeSlide.querySelector(".carousel-video");
  if (activeVideo) {
    safePlayInlineVideo(activeVideo);
  }
}

// LINKS
function applyDynamicLinks() {
  const driveUploadBtn = document.getElementById("driveUploadBtn");
  const driveAlbumBtn = document.getElementById("driveAlbumBtn");
  const googleFormBtn = document.getElementById("googleFormBtn");

  if (driveUploadBtn) driveUploadBtn.href = INVITATION_CONFIG.drivePhotosUrl;
  if (driveAlbumBtn) driveAlbumBtn.href = INVITATION_CONFIG.driveAlbumUrl;
  if (googleFormBtn) googleFormBtn.href = INVITATION_CONFIG.rsvpFormUrl;
}

// ESTRELLAS
function initMagicStars() {
  setInterval(createMagicStar, 650);
}

function createMagicStar() {
  const container = document.querySelector(".magic-stars");
  if (!container) return;

  const star = document.createElement("div");
  star.classList.add("magic-star");

  star.style.left = Math.random() * 100 + "vw";
  star.style.top = Math.random() * 100 + "vh";

  container.appendChild(star);

  setTimeout(() => {
    star.remove();
  }, 1800);
}
