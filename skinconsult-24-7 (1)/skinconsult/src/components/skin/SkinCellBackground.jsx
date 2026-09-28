// Shared decorative background. The artwork stays intentionally at the edges so
// page content remains the visual focus.
export default function SkinCellBackground({ variant = "cells", className = "" }) {
  const showMolecules = variant === "neural";

  return (
    <div
      aria-hidden="true"
      className={`skin-health-background pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="skin-health-background__wash absolute inset-0" />
      <div className="skin-health-background__glow absolute inset-0">
        <span className="skin-health-background__glow-orb skin-health-background__glow-orb--ice" />
        <span className="skin-health-background__glow-orb skin-health-background__glow-orb--cyan" />
        <span className="skin-health-background__glow-orb skin-health-background__glow-orb--violet" />
        {showMolecules && (
          <span className="skin-health-background__glow-orb skin-health-background__glow-orb--violet-top" />
        )}
      </div>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skin-health-flow" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="var(--skin-pattern-ink)" stopOpacity="0" />
            <stop offset="0.45" stopColor="var(--skin-pattern-ink)" stopOpacity="0.38" />
            <stop offset="1" stopColor="var(--skin-pattern-violet)" stopOpacity="0" />
          </linearGradient>
          <filter id="skin-health-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Left edge: calm, minimal facial profile and a small botanical cue. */}
        <g className="skin-health-background__line" transform="translate(-18 160)">
          <path d="M122 28C178 52 200 102 198 151C196 190 215 210 243 228C259 239 261 258 249 271L230 290C218 302 218 320 232 330C250 343 248 371 225 379C204 386 199 406 210 422C221 438 210 455 189 459" />
          <path d="M97 76C130 87 150 108 158 138M100 159C128 155 152 160 172 174M176 319C195 314 211 313 225 318" />
          <path className="skin-health-background__faint" d="M48 52C83 100 75 169 58 213C42 257 42 329 80 380" />
          <circle cx="137" cy="146" r="2.5" className="skin-health-background__dot" />
          <path d="M60 530C81 503 99 484 121 464M89 536C112 505 130 488 151 474M107 559C127 535 145 521 164 510" />
          <path d="M75 516C51 496 34 489 22 490C31 511 44 529 68 535C65 519 60 501 45 483" />
          <path d="M110 493C105 465 112 443 128 428C135 452 132 475 115 495" />
          <path d="M140 517C162 492 185 484 206 486C192 511 172 526 146 528" />
        </g>

        {/* A soft ribbon links edge details without crossing the reading area. */}
        <g className="skin-health-background__flow">
          <path d="M0 690C150 612 248 658 339 712C430 766 544 771 641 720" />
          <path d="M0 713C147 646 245 692 332 742C414 790 518 795 604 755" />
          <path d="M1440 680C1310 619 1213 645 1143 704C1090 749 1020 760 944 728" />
        </g>

        {/* Right edge: a clean skin cross-section with follicles, pores and hydration drops. */}
        <g className="skin-health-background__line" transform="translate(1080 495)">
          <path d="M0 68C70 45 143 51 218 64C286 76 333 71 390 49" />
          <path d="M0 89C76 68 143 75 218 87C286 98 335 95 390 75" />
          <path d="M0 137C71 122 149 128 219 142C286 155 334 151 390 130" />
          <path d="M0 190C70 174 143 181 220 196C286 208 335 204 390 184" />
          <path d="M0 242C74 224 146 232 220 247C286 260 334 256 390 235" />
          <path className="skin-health-background__faint" d="M0 113C75 94 148 102 220 115C285 127 335 123 390 102M0 166C71 148 147 155 220 169C286 181 334 178 390 157M0 216C74 199 146 206 220 220C286 232 333 228 390 208" />
          <path d="M178 65C172 101 163 124 154 151C145 178 145 210 160 237" />
          <path d="M184 65C188 99 197 124 207 150C218 177 217 208 202 237" />
          <path d="M181 80C173 113 177 139 185 158C195 139 199 114 187 80" />
          <path d="M290 67C283 95 279 119 285 143C292 166 287 191 273 215" />
          <path d="M296 67C306 99 310 122 303 147C297 168 301 191 315 215" />
          <path d="M294 78C286 106 289 128 295 143C303 128 306 106 298 78" />
          <circle cx="75" cy="88" r="3" className="skin-health-background__dot" />
          <circle cx="126" cy="80" r="2.5" className="skin-health-background__dot" />
          <circle cx="240" cy="84" r="2.5" className="skin-health-background__dot" />
          <path d="M58 170C45 188 45 202 58 218C72 202 72 188 58 170ZM105 196C94 210 94 221 105 234C117 221 117 210 105 196ZM341 155C326 175 326 191 341 210C357 191 357 175 341 155" />
        </g>

        {/* Molecular and epidermal motifs stay small and peripheral. */}
        {showMolecules && (
          <g className="skin-health-background__line skin-health-background__molecule" transform="translate(1238 92)">
            <path d="M0 42L25 27L50 42V72L25 87L0 72V42ZM50 42L75 27L100 42V72L75 87L50 72M25 87L50 102L75 87" />
            <path d="M104 94L121 84L138 94V114L121 124L104 114V94" />
            <circle cx="25" cy="27" r="3" className="skin-health-background__dot" />
            <circle cx="75" cy="27" r="3" className="skin-health-background__dot" />
            <circle cx="121" cy="84" r="2.5" className="skin-health-background__dot" />
          </g>
        )}

        <g className="skin-health-background__epidermis" transform="translate(18 670)">
          <path d="M0 75C26 54 49 54 72 74C94 93 117 91 140 72C163 53 187 54 210 75" />
          <path d="M0 98C26 77 49 77 72 97C94 116 117 114 140 95C163 76 187 77 210 98" />
          <path d="M14 118C29 102 45 102 60 117C75 132 91 131 106 116C122 101 138 102 153 117C168 132 184 131 198 117" />
        </g>

        {/* Scattered hydration highlights. */}
        <g className="skin-health-background__sparkles">
          <circle cx="281" cy="572" r="15" />
          <circle cx="1270" cy="262" r="24" />
          <circle cx="1337" cy="392" r="10" />
          <circle cx="1052" cy="367" r="8" />
          <circle cx="122" cy="666" r="7" />
          <circle cx="1270" cy="262" r="36" filter="url(#skin-health-glow)" />
        </g>
      </svg>
    </div>
  );
}
