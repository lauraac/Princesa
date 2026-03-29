const INVITATION_CONFIG = {
  quinceanera: "Evelyn Nayely Alfonso González",
  eventDate: "2026-05-09T16:00:00",
  drivePhotosUrl: "https://drive.google.com/",
  driveAlbumUrl: "https://drive.google.com/",
  rsvpFormUrl: "https://docs.google.com/forms/",
  desktopMinWidth: 900,
};
let audioEnabled = false;
let introDismissed = false;
let storyIndex = 0;
let musicWasPlayingBeforeFeaturedVideo = false;
let userPausedMusicManually = false;

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
  const introVideo = document.getElementById("introVideo");
  const introCard = document.querySelector(".intro-card");

  if (!introOverlay || !enterBtn || !introVideo || !introCard) return;

  safePlayVideo(introVideo);

  function closeIntro() {
    if (introDismissed) return;
    introDismissed = true;

    introVideo.pause();
    introVideo.muted = true;
    introVideo.currentTime = 0;

    introOverlay.classList.add("intro-overlay--hidden");

    setTimeout(() => {
      introOverlay.style.display = "none";

      const toggleMusicBtn = document.getElementById("toggleMusicBtn");
      if (toggleMusicBtn) {
        toggleMusicBtn.classList.remove("hidden-music-btn");
      }

      if (typeof window.startInvitationMusic === "function") {
        window.startInvitationMusic();
      }
    }, 650);
  }

  async function activateIntroSound() {
    if (audioEnabled) return;

    try {
      audioEnabled = true;

      const hint = document.getElementById("tapAudioHint");
      if (hint) hint.style.display = "none";

      introVideo.pause();
      introVideo.currentTime = 0;
      introVideo.muted = false;
      introVideo.volume = 1;

      await introVideo.play();
    } catch (error) {
      console.warn("No se pudo activar sonido en el video:", error);
      audioEnabled = false;
    }
  }

  introOverlay.addEventListener("click", async (event) => {
    const clickedEnter = event.target.closest("#enterInvitationBtn");

    if (clickedEnter) return;

    await activateIntroSound();
  });

  enterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeIntro();
  });

  introVideo.addEventListener("ended", () => {
    closeIntro();
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

  function setMusicButtonState(isPlaying) {
    toggleMusicBtn.classList.toggle("playing", isPlaying);
    toggleMusicBtn.classList.toggle("paused", !isPlaying);
    toggleMusicBtn.textContent = isPlaying ? "♫" : "♪";
    toggleMusicBtn.setAttribute(
      "aria-label",
      isPlaying ? "Pausar música" : "Reproducir música",
    );
  }

  async function playMusic(fromAuto = false) {
    try {
      await bgMusic.play();
      setMusicButtonState(true);

      if (!fromAuto) {
        userPausedMusicManually = false;
      }
    } catch (error) {
      console.warn("No se pudo reproducir la música:", error);
      setMusicButtonState(false);
    }
  }

  function pauseMusic(fromAuto = false) {
    bgMusic.pause();
    setMusicButtonState(false);

    if (!fromAuto) {
      userPausedMusicManually = true;
    }
  }

  toggleMusicBtn.addEventListener("click", async (event) => {
    event.stopPropagation();

    if (bgMusic.paused) {
      await playMusic(false);
    } else {
      pauseMusic(false);
    }
  });

  bgMusic.addEventListener("play", () => setMusicButtonState(true));
  bgMusic.addEventListener("pause", () => setMusicButtonState(false));

  setMusicButtonState(false);

  window.startInvitationMusic = () => playMusic(true);
  window.pauseInvitationMusic = () => pauseMusic(true);
  window.isInvitationMusicPlaying = () => !bgMusic.paused;
  window.wasMusicPausedManually = () => userPausedMusicManually;
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
  let autoSlideInterval = null;
  let resumeTimeout = null;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "story-dot";
    if (index === 0) dot.classList.add("active");

    dot.addEventListener("click", () => {
      storyIndex = index;
      updateStorySlider();
      pauseAndResumeAutoSlide();
    });

    dotsContainer.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => {
    storyIndex = storyIndex > 0 ? storyIndex - 1 : slides.length - 1;
    updateStorySlider();
    pauseAndResumeAutoSlide();
  });

  nextBtn.addEventListener("click", () => {
    storyIndex = storyIndex < slides.length - 1 ? storyIndex + 1 : 0;
    updateStorySlider();
    pauseAndResumeAutoSlide();
  });

  let startX = 0;
  let currentX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      stopAutoSlide();
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
    pauseAndResumeAutoSlide();
  });

  function updateStorySlider() {
    track.style.transform = `translateX(-${storyIndex * 100}%)`;

    const dots = dotsContainer.querySelectorAll(".story-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === storyIndex);
    });

    updateCarouselVideos();
  }

  function goToNextSlide() {
    storyIndex = storyIndex < slides.length - 1 ? storyIndex + 1 : 0;
    updateStorySlider();
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
      goToNextSlide();
    }, 4500);
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }

  function pauseAndResumeAutoSlide() {
    stopAutoSlide();

    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
    }

    resumeTimeout = setTimeout(() => {
      startAutoSlide();
    }, 6000);
  }

  updateStorySlider();
  startAutoSlide();
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

        if (
          media.tagName === "VIDEO" &&
          media.classList.contains("inline-story-video")
        ) {
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
  const featuredVideoHint = document.getElementById("featuredVideoHint");

  if (featuredVideo) {
    async function enableFeaturedVideoAudio() {
      try {
        featuredVideo.muted = false;
        featuredVideo.volume = 1;

        if (featuredVideoHint) {
          featuredVideoHint.style.display = "none";
        }

        await featuredVideo.play();
      } catch (error) {
        console.warn("No se pudo activar el audio del video destacado:", error);
      }
    }

    // tocar el video activa audio
    featuredVideo.addEventListener("click", enableFeaturedVideoAudio);

    // tocar el mensaje también activa audio
    if (featuredVideoHint) {
      featuredVideoHint.addEventListener("click", enableFeaturedVideoAudio);
    }

    const featuredObserver = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (typeof window.isInvitationMusicPlaying === "function") {
              musicWasPlayingBeforeFeaturedVideo =
                window.isInvitationMusicPlaying();
            } else {
              musicWasPlayingBeforeFeaturedVideo = false;
            }

            if (
              musicWasPlayingBeforeFeaturedVideo &&
              typeof window.pauseInvitationMusic === "function"
            ) {
              window.pauseInvitationMusic();
            }

            try {
              featuredVideo.currentTime = 0;
              featuredVideo.muted = true; // entra en silencio
              featuredVideo.volume = 1;

              if (featuredVideoHint) {
                featuredVideoHint.style.display = "block";
              }

              await featuredVideo.play();
            } catch (error) {
              console.warn(
                "El navegador bloqueó la reproducción automática con audio:",
                error,
              );
            }
          } else {
            featuredVideo.pause();
            featuredVideo.currentTime = 0;
            featuredVideo.muted = true;

            if (featuredVideoHint) {
              featuredVideoHint.style.display = "block";
            }

            if (
              musicWasPlayingBeforeFeaturedVideo &&
              typeof window.wasMusicPausedManually === "function" &&
              !window.wasMusicPausedManually() &&
              typeof window.startInvitationMusic === "function"
            ) {
              window.startInvitationMusic();
            }

            musicWasPlayingBeforeFeaturedVideo = false;
          }
        }
      },
      { threshold: 0.6 },
    );

    featuredObserver.observe(featuredVideo);
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
