import { useState, useRef, useEffect } from "react";

/*
 * FOREAS — Section Témoignages Vidéo
 * Mobile-first design • Carousel horizontal swipable
 *
 * Concept marketing :
 * - On vend l'APP (optimisation revenus), pas le rattachement
 * - Les chauffeurs parlent de leurs RÉSULTATS avec l'app
 * - Format vertical (9:16) natif mobile
 * - Thumbnail statique + play on tap = zero weight initial
 * - Stat clé visible AVANT de regarder la vidéo (hook)
 * - Citation courte en dessous (renforce sans forcer la vidéo)
 */

const TESTIMONIALS = [
  {
    id: 1,
    name: "Karim",
    city: "Paris 11e",
    since: "Utilisateur depuis 4 mois",
    stat: { value: "+38%", label: "de CA hebdo" },
    quote: "Je ne tourne plus à vide. L'IA m'envoie au bon endroit avant même que la demande explose.",
    thumbnailColor: "#1a1033", // placeholder — will be real image
    accentColor: "#00d4ff",
  },
  {
    id: 2,
    name: "Yassine",
    city: "Lyon",
    since: "Utilisateur depuis 2 mois",
    stat: { value: "-2h", label: "de temps mort / jour" },
    quote: "Avant je faisais 10h pour 180€. Maintenant je fais 8h pour 220€.",
    thumbnailColor: "#0d1a2e",
    accentColor: "#a855f7",
  },
  {
    id: 3,
    name: "Fatou",
    city: "Marseille",
    since: "Utilisatrice depuis 6 mois",
    stat: { value: "+520€", label: "/ mois net" },
    quote: "C'est mon copilote. Elle me dit quand rentrer, quand rester, et elle a toujours raison.",
    thumbnailColor: "#1a0d1f",
    accentColor: "#22c55e",
  },
];

// ===== PLAY BUTTON =====
function PlayButton() {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        border: "2px solid rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.background = "rgba(0,212,255,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.background = "rgba(0,0,0,0.6)";
      }}
    >
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M2 1.5L18.5 12L2 22.5V1.5Z" fill="white" />
      </svg>
    </div>
  );
}

// ===== STAT BADGE =====
function StatBadge({ value, label, color }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 8,
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      >
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <span style={{ color, fontSize: 14, fontWeight: 600 }}>{value}</span>
      <span style={{ color: `${color}99`, fontSize: 12 }}>{label}</span>
    </div>
  );
}

// ===== VIDEO CARD =====
function VideoCard({ testimonial, isActive }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      style={{
        flexShrink: 0,
        width: 260,
        scrollSnapAlign: "center",
        opacity: isActive ? 1 : 0.5,
        transform: isActive ? "scale(1)" : "scale(0.92)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Video thumbnail — 9:16 vertical */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "9/14",
          borderRadius: 16,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${testimonial.thumbnailColor}, #0a0a12)`,
          border: isActive
            ? `1px solid ${testimonial.accentColor}30`
            : "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
        }}
        onClick={() => setPlaying(!playing)}
      >
        {/* Simulated thumbnail content */}
        {!playing ? (
          <>
            {/* Placeholder silhouette — in production: real thumbnail */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {/* Driver avatar placeholder */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${testimonial.accentColor}40, ${testimonial.accentColor}10)`,
                  border: `2px solid ${testimonial.accentColor}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  color: "white",
                  fontWeight: 300,
                  marginBottom: 12,
                }}
              >
                {testimonial.name[0]}
              </div>

              <PlayButton />
            </div>

            {/* Bottom gradient overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "40%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
              }}
            />

            {/* Stat badge — visible BEFORE playing (the hook) */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 12,
                right: 12,
              }}
            >
              <StatBadge
                value={testimonial.stat.value}
                label={testimonial.stat.label}
                color={testimonial.accentColor}
              />
            </div>

            {/* Duration badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              0:38
            </div>
          </>
        ) : (
          /* Playing state — simulated */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `3px solid ${testimonial.accentColor}`,
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <span
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
              >
                Lecture en cours...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Driver info + quote — below thumbnail */}
      <div style={{ padding: "12px 4px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ color: "white", fontSize: 15, fontWeight: 600 }}>
            {testimonial.name}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            •
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {testimonial.city}
          </span>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          « {testimonial.quote} »
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 11,
            marginTop: 6,
          }}
        >
          {testimonial.since}
        </p>
      </div>
    </div>
  );
}

// ===== DOT INDICATOR =====
function DotIndicator({ count, active }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginTop: 24,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === active ? 24 : 6,
            height: 6,
            borderRadius: 3,
            background:
              i === active ? "#00d4ff" : "rgba(255,255,255,0.15)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ===== MAIN SECTION =====
export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(1); // Start centered
  const scrollRef = useRef(null);

  // Handle scroll to detect active card
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      const cardWidth = 260 + 20; // card width + gap
      const idx = Math.round(
        (center - el.clientWidth / 2) / cardWidth
      );
      setActiveIndex(Math.max(0, Math.min(idx, TESTIMONIALS.length - 1)));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    // Initial center scroll
    el.scrollLeft =
      1 * (260 + 20) - (el.clientWidth - 260) / 2;
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        background: "#06060c",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 0",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* === HEADER === */}
      <div
        style={{
          textAlign: "center",
          padding: "0 24px",
          marginBottom: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Social proof chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid rgba(0,212,255,0.15)",
            marginBottom: 20,
          }}
        >
          {/* 3 stacked avatars */}
          <div style={{ display: "flex", marginRight: 4 }}>
            {["K", "Y", "F"].map((letter, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background:
                    i === 0
                      ? "linear-gradient(135deg, #00d4ff, #0066ff)"
                      : i === 1
                        ? "linear-gradient(135deg, #a855f7, #6b21a8)"
                        : "linear-gradient(135deg, #22c55e, #15803d)",
                  border: "2px solid #06060c",
                  marginLeft: i > 0 ? -8 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "white",
                  fontWeight: 600,
                  zIndex: 3 - i,
                  position: "relative",
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: "0.03em",
            }}
          >
            847+ chauffeurs actifs
          </span>
        </div>

        <h2
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 8px",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          Ils gagnent plus.
          <br />
          <span style={{ color: "#00d4ff" }}>Ils en parlent.</span>
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 15,
            margin: 0,
          }}
        >
          Résultats réels, tournés sur le terrain.
        </p>
      </div>

      {/* === CAROUSEL === */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "0 calc(50% - 130px)",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {TESTIMONIALS.map((t, i) => (
          <VideoCard
            key={t.id}
            testimonial={t}
            isActive={i === activeIndex}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <DotIndicator count={TESTIMONIALS.length} active={activeIndex} />

      {/* === TRUST BAR === */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginTop: 40,
          padding: "0 24px",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          { icon: "🎬", text: "Tournés par un pro" },
          { icon: "📊", text: "Résultats vérifiés" },
          { icon: "🔒", text: "Données protégées" },
        ].map((badge, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
            }}
          >
            <span style={{ fontSize: 14 }}>{badge.icon}</span>
            <span>{badge.text}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p
        style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.15)",
          fontSize: 10,
          marginTop: 24,
          padding: "0 24px",
        }}
      >
        Résultats individuels. Les performances varient selon la zone, les
        horaires et l'usage de l'application.
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
