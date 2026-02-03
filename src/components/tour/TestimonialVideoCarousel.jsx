"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Volume2, VolumeX } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

/* --------- Helper: Extract YouTube ID --------- */
const getYouTubeId = (input = "") => {
  const iframeSrcMatch = input.match(/src=["']([^"']+)["']/);
  const srcUrl = iframeSrcMatch ? iframeSrcMatch[1] : input;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = srcUrl.match(p);
    if (m) return m[1];
  }
  return null;
};

/* --------- Helper: Check Instagram --------- */
const getInstagramEmbedUrl = (input = "") => {
  if (!input.includes("instagram.com")) return null;
  const match = input.match(/instagram\.com\/(?:reel|p|tv)\/([^/?#&]+)/i);
  if (match?.[1]) {
    // Adds wp=0 to hide header
    return `https://www.instagram.com/p/${match[1]}/embed/?cr=1&v=14&wp=0&rd&hidecaption=1`;
  }
  return null;
};

export default function TourVideoTestimonials({ videos = [] }) {
  const [api, setApi] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [ytReadyFlag, setYtReadyFlag] = useState(false);
  // console.log("videos", videos);

  const videoRefs = useRef([]);
  const ytPlayers = useRef({});
  const hasYouTube = videos.some((v) => !!getYouTubeId(v));
  const hasInstagram = videos.some((v) => v.includes("instagram.com"));

  /* --- Load YouTube API if needed --- */
  useEffect(() => {
    if (!hasYouTube || typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setYtReadyFlag(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      setYtReadyFlag(true);
    };
  }, [hasYouTube]);

  /* --- Load Instagram embed.js once --- */
  useEffect(() => {
    if (!hasInstagram || typeof window === "undefined") return;

    // Already exists
    if (window.instgrm?.Embeds) return;

    if (
      !document.querySelector(
        'script[src="https://www.instagram.com/embed.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => window.instgrm?.Embeds?.process();
      document.body.appendChild(script);
    }
  }, [hasInstagram]);

  /* --- Track Carousel selection --- */
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    setActiveIndex(api.selectedScrollSnap());
    return () => api.off("select", onSelect);
  }, [api]);

  /* --- Pause all videos --- */
  const pauseAll = () => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.pause();
      v.muted = true;
    });
    Object.values(ytPlayers.current).forEach((p) => {
      try {
        p.pauseVideo();
        p.mute();
      } catch {}
    });
  };

  /* --- Play specific index --- */
  const startIndex = (i) => {
    const v = videoRefs.current[i];
    const yt = ytPlayers.current[i];
    pauseAll();

    if (v) {
      v.muted = false;
      v.play().catch(() => {});
    } else if (yt) {
      try {
        yt.unMute();
        yt.playVideo();
      } catch {}
    }

    setPlayingIndex(i);
    setActiveIndex(i);
    api?.scrollTo(i);
  };

  /* --- Handle toggle on click --- */
  const handleToggle = (i) => {
    if (playingIndex === i) {
      const v = videoRefs.current[i];
      const yt = ytPlayers.current[i];
      if (v) {
        v.muted = true;
        v.pause();
      } else if (yt) {
        try {
          yt.mute();
          yt.pauseVideo();
        } catch {}
      }
      setPlayingIndex(null);
      return;
    }
    startIndex(i);
  };

  if (!videos.length) return null;

  return (
    <section id="video-testimonials" className="scroll-mt-28 mt-6">
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {videos.map((src, i) => {
            const id = getYouTubeId(src);
            const instaUrl = getInstagramEmbedUrl(src);
            const isYouTube = !!id;
            const isInstagram = !!instaUrl;

            return (
              <CarouselItem
                key={i}
                className="pl-3 basis-[90%] sm:basis-1/2 overflow-y-visible md:basis-1/3 lg:basis-[25%]"
              >
                <VideoCard
                  src={src}
                  youTubeId={id}
                  instaUrl={instaUrl}
                  isYouTube={isYouTube}
                  isInstagram={isInstagram}
                  isMuted={playingIndex !== i}
                  ytReady={ytReadyFlag}
                  attachVideoRef={(el) => (videoRefs.current[i] = el)}
                  registerYT={(player) => (ytPlayers.current[i] = player)}
                  onClick={() => handleToggle(i)}
                  onMuteToggle={() => handleToggle(i)}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="left-2 border-0" />
        <CarouselNext className="right-2 border-0" />
      </Carousel>
    </section>
  );
}

/* --------------------------- Video Card --------------------------- */
function VideoCard({
  src,
  youTubeId,
  instaUrl,
  isYouTube,
  isInstagram,
  isMuted,
  ytReady,
  attachVideoRef,
  registerYT,
  onClick,
  onMuteToggle,
}) {
  const iframeRef = useRef(null);
  const blockRef = useRef(null);

  // console.log("VideoCard", {
  //   src,
  //   youTubeId,
  //   instaUrl,
  //   isYouTube,
  //   isInstagram,
  //   isMuted,
  //   ytReady,
  // });

  /* --- Initialize YouTube player --- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isYouTube || !ytReady || !iframeRef.current || !youTubeId) return;

    const player = new window.YT.Player(iframeRef.current, {
      videoId: youTubeId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        disablekb: 1,
        fs: 0,
        rel: 0,
        iv_load_policy: 3,
        playsinline: 1,
      },
      events: {
        onReady: (e) => {
          registerYT(e.target);
          if (isMuted) e.target.mute();
          else e.target.unMute();
        },
      },
    });

    return () => {
      try {
        player.destroy();
      } catch {}
    };
  }, [isYouTube, ytReady, youTubeId, registerYT, isMuted]);

  /* --- Reprocess Instagram embeds after mount --- */
  useEffect(() => {
    if (!isInstagram || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        window.instgrm?.Embeds?.process(blockRef.current);
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [isInstagram, instaUrl]);

  return (
    <div
      className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {isYouTube ? (
        <div ref={iframeRef} className="absolute inset-0 w-full h-full" />
      ) : (
        <video
          ref={attachVideoRef}
          src={src}
          loop
          playsInline
          muted={isMuted}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!isInstagram && (
        <div className="absolute bottom-3 left-3 z-10">
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle();
            }}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// : isInstagram ? (
//         <div
//           ref={blockRef}
//           className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-white"
//         >
//           <blockquote
//             className="instagram-media insta"
//             data-instgrm-permalink={instaUrl.replace("/embed", "")}
//             data-instgrm-version="14"
//           ></blockquote>
//         </div>
//       )
