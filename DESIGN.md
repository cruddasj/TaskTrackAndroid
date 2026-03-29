# Design System Documentation: The Obsidian Architect

## 1. Overview & Creative North Star

### Creative North Star: "The Obsidian Architect"
The vision for this design system is to move beyond the utilitarian "app" feel and into the realm of **High-End Editorial Precision**. Rather than a flat grid of tasks, we treat the UI as a physical workspace carved from dark glass and charcoal stone. 

"The Obsidian Architect" relies on **Tonal Depth** rather than structural lines. We reject the "boxed-in" nature of traditional Material Design in favor of intentional asymmetry and rhythmic white space. By utilizing the vibrant green primary accent against a near-black foundation, we create a sense of focused luminescence—like a high-end watch face or a professional studio dashboard. 

**Core Tenets:**
*   **Luminescence over Decoration:** Light (color and tone) is used to guide the eye, never for mere styling.
*   **Structural Silence:** We remove the "noise" of dividers and borders to let content breathe.
*   **Weighted Typography:** Plus Jakarta Sans is used with extreme contrast in scale to establish a clear editorial hierarchy.

---

## 2. Colors

The color palette is designed to be immersive, minimizing eye strain while maximizing focus through "The Obsidian Architect" logic.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface-container-low` (#131313) section on a `surface` (#0e0e0e) background.
2.  **Negative Space:** Using the Spacing Scale to create "voids" that naturally separate groups.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
*   **Base:** `background` (#0e0e0e).
*   **Sectioning:** `surface-container` (#1a1a1a) for secondary navigation or sidebars.
*   **Prominence:** `surface-container-high` (#20201f) for the primary content focus.
*   **Interaction:** `surface-bright` (#2c2c2c) for elements that need to feel "closer" to the user.

### The "Glass & Gradient" Rule
To elevate the experience, floating elements (like FABs or Overlays) should utilize **Glassmorphism**.
*   **Token Usage:** Use `surface-container` at 70% opacity with a `20px` backdrop-blur.
*   **Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#91f78e) to `primary_container` (#52b555) at a 135-degree angle to add a "liquid" premium feel.

---

## 3. Typography: Plus Jakarta Sans

We utilize **Plus Jakarta Sans** for its geometric clarity and modern "ink-trap" aesthetics, which remain legible even at high-contrast dark modes.

*   **Display Scale (Display-LG to Display-SM):** Used for "Big Data" moments—task counts, focus timers, or daily progress percentages. These should be set with `-0.02em` letter spacing to feel tight and architectural.
*   **Headline & Title:** Use `headline-lg` (#ffffff) for page titles. Pair this with `on_surface_variant` (#adaaaa) for sub-headers to create an immediate visual "step-down" in importance.
*   **The Utility Layer:** `label-md` and `label-sm` must be set in uppercase with `0.05em` letter spacing when used for categories or status tags to provide a technical, high-precision look.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Stacking**. 
*   **Example:** A "Task Card" (`surface-container-highest`: #262626) sitting on a "Project Feed" (`surface-container-low`: #131313). The 13-hex-point difference creates a soft, natural lift without the need for dated drop shadows.

### Ambient Shadows
Shadows should only be used for "Floating" elements (Modals, FABs, Menus). 
*   **Specs:** `Blur: 24px`, `Spread: -4px`, `Opacity: 6%`.
*   **Color:** Use a tinted shadow (Shadow Color: `#000000`) to ensure the element feels integrated into the charcoal background rather than "hovering" over it.

### The "Ghost Border" Fallback
If an element requires an edge for accessibility (e.g., a text input), use a **Ghost Border**:
*   **Token:** `outline-variant` (#484847) at **15% opacity**. This creates a suggestion of a boundary that disappears into the background, maintaining the "No-Line" philosophy.

---

## 5. Components

### Buttons
*   **Primary:** Fill with `primary` (#91f78e), text in `on_primary` (#005e17). Use `full` roundedness. No shadows.
*   **Secondary:** Fill with `secondary_container` (#006d3a), text in `on_secondary_container` (#e3ffe6).
*   **Tertiary/Ghost:** Text only in `primary` (#91f78e). On hover, add a `primary` fill at 8% opacity.

### Chips (Action & Filter)
*   **Style:** `full` roundedness. Use `surface-container-highest` (#262626) as the base.
*   **Selected State:** Transition background to `primary` (#91f78e) with `on_primary` text.

### Input Fields
*   **Style:** Forgo the "Boxed" look. Use a `surface-container-low` (#131313) fill with a `2px` bottom-only stroke using the `primary` (#91f78e) token on focus.
*   **Focus State:** Apply a subtle `primary` outer glow (4px blur, 10% opacity) to simulate luminescence.

### Cards & Lists
*   **Constraint:** **Dividers are forbidden.** 
*   **Implementation:** Separate list items using `spacing-4` (1rem). Each item should exist on a `surface-container-low` background that slightly shifts to `surface-container-high` on hover to provide interactive feedback.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts. For example, align headline text to the left while keeping action buttons floated to the far right with significant white space between them.
*   **Do** use the `primary` green (#91f78e) sparingly. It is a "laser" that directs attention; overusing it will break the dark, focused atmosphere.
*   **Do** use `surface-container-lowest` (#000000) for "deep wells" like background areas behind cards to increase perceived contrast.

### Don't:
*   **Don't** use 100% white (#ffffff) for long-form body text. Use `on_surface_variant` (#adaaaa) to reduce glare and improve readability.
*   **Don't** use standard Material 3 "Elevated" buttons with heavy shadows. Use tonal shifts instead.
*   **Don't** ever use a divider line to separate two pieces of content. If they need separation, they need more space (refer to Spacing Scale `8` or `12`).
*   **Don't** use sharp corners. Every interactive element must use at least `DEFAULT` (0.5rem) or `lg` (1rem) roundedness to maintain the "Soft Modern" personality.