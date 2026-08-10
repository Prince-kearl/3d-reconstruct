# 3D Reconstruct

You are a senior frontend engineer and UI reconstruction specialist with exceptional attention to visual detail.

Your task is to recreate the attached reference image as a pixel-accurate, 1:1 frontend implementation.

Primary objective

Build a visually exact clone of the desktop application interface shown in the attached reference image.

The reference image is the single source of truth for:

Overall composition

Layout proportions

Panel dimensions

Component placement

Spacing

Alignment

Typography

Colours

Borders

Shadows

Icons

Control sizes

Viewport divisions

Visual hierarchy

Density

Dark theme styling

Do not redesign, simplify, modernise, reinterpret, or improve the interface. Reproduce it as faithfully as possible.

This phase is frontend design only.

Do not build:

A real reconstruction engine

Backend services

Authentication

Database integration

Real file processing

Actual 3D reconstruction

Actual model exporting

Production API calls

Server-side logic

All data may be hardcoded or mocked. However, the interface must look and behave like a polished desktop application.

Reference handling

Carefully inspect the attached image before writing code.

Treat every visible measurement and visual relationship as intentional, including:

The width of the navigation rail

The height of the application header

The left configuration panel width

The right properties panel width

The central workspace proportions

The console height

The spacing between panels

The internal padding of cards

The size of buttons, sliders, tabs, inputs and icons

Border thickness and corner radius

Text hierarchy and label placement

The distribution of the five 3D preview views

Do not use the complete screenshot as a page background or as one large image. The interface must be constructed from real frontend components.

You may use the reference image to guide the creation of individual visual assets, but the final page must remain a structured and maintainable implementation.

Preferred technology

If no frontend stack already exists, use:

React

TypeScript

Vite

Tailwind CSS

Lucide React for interface icons

CSS Grid and Flexbox for layout

Three.js or React Three Fiber only if needed for the mocked 3D viewports

If the project already uses a frontend framework, preserve the existing framework and conventions unless they prevent accurate implementation.

Do not introduce a large UI component library. The design should be recreated with custom components and styling so that it matches the reference precisely.

Target viewport

The reference is a widescreen desktop interface with an approximate aspect ratio of 16:10.

Optimise the primary implementation for:

Reference viewport: approximately 1536 × 1024

Minimum supported desktop width: 1280px

Ideal browser zoom: 100%

Full available viewport height

No normal document scrolling at the reference size

At the reference viewport, all major sections should remain visible at once, including:

Top application bar

Workspace toolbar

Left navigation rail

Left configuration panel

Central viewports

Console and progress area

Right properties panel

Bottom status bar

The interface should feel like a native desktop creative tool rather than a conventional website.

Overall page structure

Recreate the screen using the following major regions:

Global application header

Left vertical navigation rail

Workspace toolbar

Left reconstruction configuration panel

Central 3D workspace

Multi-view preview grid

Bottom console and reconstruction progress panel

Right properties panel

Bottom application status bar

Use a full-screen application shell with a very dark charcoal background.

The interface should have narrow gaps between panels and restrained borders. Panels should appear subtly separated without looking like floating cards from a typical SaaS dashboard.

Colour system

Derive the final colours directly from the screenshot.

Use a palette close to:

Application background: near-black blue-charcoal

Primary panel background: dark charcoal with a subtle blue undertone

Secondary surfaces: slightly lighter blue-grey charcoal

Borders: low-contrast slate

Primary text: cool off-white

Secondary text: muted light grey

Disabled or tertiary text: subdued grey

Primary accent: vivid indigo-purple

Secondary accent: electric violet

Success indicator: bright green

Export action: yellow-green/lime gradient

Axis indicators: red, green and blue

Avoid pure black and pure white except where necessary. Preserve the low-contrast, professional dark-theme appearance.

Create reusable CSS variables or theme tokens for all major colours.

Typography

Use a compact modern sans-serif font similar to the reference.

Recommended choices:

Inter

Geist

IBM Plex Sans

A close system sans-serif fallback

Typography should be dense and restrained.

Approximate hierarchy:

Application menus: 12–13px

Panel section headings: 11–12px, medium or semibold

Form labels: 11–12px

Supporting text: 9–11px

Console text: 10–11px monospace

Progress percentage: approximately 22px

Button text: 12–13px, medium weight

Do not use large marketing-style typography.

1. Global application header

Create a top header spanning the full screen width.

Approximate height: 50–54px.

Left side

Include:

A compact white geometric logo

Product name: “DXF2OBJ”

A small “BETA” badge

Menu items:

File

Edit

View

Workspace

Tools

Help

The logo and product name should be visually grouped. The BETA badge should be a small muted rounded rectangle.

Centre

Display:

A small document/project icon

“Portrait Project”

A downward chevron

This project selector should be centred independently of the left and right header content.

Right side

Include icons and indicators matching the reference:

Grid/layout icon

Layers or stacked-panels icon

“GPU”

Green status dot

Dropdown chevron

Divider

Minimise icon

Maximise icon

Close icon

Keep these controls compact and aligned like native desktop window controls.

2. Left navigation rail

Create a narrow vertical rail below the header and above the bottom status bar.

Approximate width: 78–82px.

The rail should contain vertically stacked icon-and-label navigation items:

Explorer

Reconstruct — active

Refine

Texture

Export

Scenes

History

Console

Settings

The “Reconstruct” item must be active.

Active-state styling:

Dark indigo-tinted background

Thin bright purple line on the far-left edge

Purple icon

Light purple label

Slight corner radius

Inactive items should use muted grey icons and text.

Maintain the same generous vertical separation seen in the reference.

3. Workspace toolbar

Place a horizontal toolbar above the main content, starting after the navigation rail.

Approximate height: 43–46px.

Left side

Include:

Small sparkle/tool icon

“3D Workspace”

A small utility icon near the end of this subsection

Undo/redo-style navigation icons

Centre

Create a segmented display-mode control:

Solid — selected

Wireframe — unselected

The selected Solid option should have an indigo-purple tinted background and purple cube icon.

Right side

Add the compact viewport utility icons shown in the reference:

Orbit or scene-control icon

Visibility or inspection icon

Layout icons

Multi-panel grid options

A final selected purple layout button

Use consistent 28–32px icon hit areas.

4. Left reconstruction configuration panel

Place this panel to the right of the navigation rail.

Approximate width: 292–304px.

The panel should fill the available height between the workspace toolbar and bottom status bar.

Use a subtle border and approximately 6px corner radius. Its content may scroll vertically if the viewport height becomes too small, but the scrollbar must be narrow and dark.

Section: “1. INPUT”

Include:

Section title

Label: “Source Image”

A large portrait preview card matching the reference

A dark “Change Image” button

Supporting file text:

“PNG, JPG, WEBP”

“(Max 20MB)”

The image preview should have rounded corners and approximately the same 16:11 proportion as the reference.

If a separate portrait asset is unavailable, use a visually similar professional front-facing male portrait placeholder. Do not substitute a colourful lifestyle image. The portrait should remain dark, centred and neutral because it is part of the visual fidelity.

Section: “2. RECONSTRUCTION ENGINE”

Include a labelled dropdown:

Label: “Engine”

Value: “ECON (Human)”

Down chevron

Quality segmented control

Include:

Label: “Quality”

Options:

Fast

Balanced — selected

High

The Balanced option should use a purple border, tinted background and purple text.

Detail Preservation slider

Include:

Label: “Detail Preservation”

Slider with purple filled track

Value: “85%”

Match the thumb size and alignment visible in the screenshot.

Symmetry Assist

Include:

Label: “Symmetry Assist”

Toggle switched on

Indigo-purple track

White knob

Multi-view upload zone

Include:

Label: “Multi-view (Optional)”

Small dashed-border upload panel

“Add more images”

Upload icon

“Drag & drop or click to upload”

“PNG, JPG”

Primary reconstruction button

Create a full-width purple gradient button:

Reconstruction/cube icon

Text: “Start Reconstruction”

Below it, centre the text:

“Estimated time: 2 - 4 min”

The button should have a subtle glow, but do not exaggerate it.

5. Central 3D workspace

The central workspace is the visual focus of the interface.

Use a large central region subdivided into:

One large perspective viewport on the left

Four smaller orthographic viewports on the right

Console/progress region below

Large perspective viewport

Add:

Label “Perspective” in the top-left

Large grey 3D male bust centred in the viewport

Dark grid floor receding into perspective

Subtle horizontal and vertical scene guide lines

Soft vignette around the viewport edges

Professional modelling-tool atmosphere

The bust should resemble a scanned or reconstructed human head and upper shoulders in matte grey material.

If a functional 3D asset is available, render it using Three.js or React Three Fiber with:

Neutral grey material

Soft frontal and rim lighting

Perspective camera

Dark floor grid

No bright reflections

Slow or no automatic movement

If no usable 3D model asset is available, use a carefully prepared static bust image or placeholder that visually matches the reference. Preserving the layout and appearance is more important than implementing real 3D functionality.

Do not use unrelated primitive shapes such as a cube, sphere or generic astronaut in place of the bust.

Vertical viewport tool strip

Place a narrow vertical tool strip along the left side of the main perspective viewport.

Include approximately seven stacked tool buttons representing:

Orbit or focus — selected

Move

Rotate

Reset or centre

Zoom

Frame

Additional viewport tool

The selected tool should have a purple gradient background.

Bottom floating viewport controls

Place a floating dark toolbar near the bottom centre of the perspective viewport.

Include controls similar to:

Pointer — selected

Hand/pan

Move

Frame/focus

Grid

Camera

Fullscreen

Use separators where visible. Keep the toolbar compact, semi-elevated and subtly transparent.

6. Multi-view preview grid

To the right of the large perspective viewport, reproduce the four orthographic views:

Front

Right

Back

Left

Layout:

Front view across the upper half

Right view across the middle half

Back and Left views sharing the bottom row equally

Each viewport should include:

View name in the top-left

Down chevron

Grey bust from the correct angle

Dark modelling background

Thin border separating it from neighbouring views

Include small 3D axis indicators near the lower-left area of the Front and Right viewports:

X axis in red

Y axis in green

Z axis in blue

Tiny labels and centre point

The model should remain consistently scaled across corresponding views.

7. Console and reconstruction progress area

Below the central viewports, add a horizontal panel divided into:

Console area on the left

Reconstruction Progress area on the right

Approximate height: 190–200px.

Console tabs

Include:

Console — selected

Logs

Jobs

The selected Console tab should have purple text and a purple top or bottom indicator.

Include a small utility icon on the far right of the tab bar.

Console content

Use a monospace font and recreate these lines:

[10:24:31] Image loaded successfully (1024x1280)
[10:24:32] Human detection: 1 person detected
[10:24:33] Background removal: completed
[10:24:34] Starting ECON reconstruction (Balanced mode)...
[10:25:12] Initial mesh generated
[10:25:28] Refining geometry...
[10:26:05] Hole filling completed
[10:26:18] Final mesh ready

Use muted grey text. Preserve line spacing and alignment.

Reconstruction Progress

Include the heading:

“Reconstruction Progress”

Display the following completed steps with green checkmarks:

Preprocessing

Human Detection

Mesh Generation

Refinement

Post Processing

Completed

Add a circular progress indicator to the right:

Green circular ring

“100%” centred

“Completed” below the percentage

“03:47” below the circle

The progress ring should have a soft green gradient similar to the reference.

8. Right properties panel

Place a fixed-width panel on the far right.

Approximate width: 348–360px.

The panel should fill the height from below the global header to above the status bar.

Top tabs

Include:

Properties — selected

History

The selected tab should have purple text and a thin purple top border.

Model Info section

Create a collapsible section titled:

“Model Info”

Show two-column values:

LabelValueVertices1,248,532Faces2,496,980Triangles2,496,980Size18.6 × 24.7 × 18.4 cm

Align values to the right.

Transform section

Create a collapsible section titled:

“Transform”

Include three-column field rows.

Scale:

1.00

1.00

1.00

Lock icon on the right

Position:

X 0.00

Y 0.00

Z 0.00

Rotation:

X 0°

Y 0°

Z 0°

Include a full-width secondary button:

“Reset Transform”

Inputs should be compact, dark and outlined with subtle borders.

Reconstruction section

Create a collapsible section titled:

“Reconstruction”

Include sliders:

Hole Filling — 80%

Smoothing — 40%

Detail Level — 70%

Use purple slider tracks and purple circular thumbs.

Include:

“Remove Noise”

Toggle switched on

Output Settings section

Create a collapsible section titled:

“Output Settings”

Include:

Format:

OBJ dropdown

Scale (cm):

20.0 input

Target Polycount:

High (2.5M) dropdown

Watertight:

Toggle switched on

Export button

Add a large full-width lime/yellow-green gradient button:

Export icon

“Export Model”

The button should use dark text and be visually prominent without introducing excessive shadow.

9. Bottom status bar

Create a status bar running across the bottom of the application.

Approximate height: 36–40px.

Left side

Include:

Small square utility icon

Branch icon

“main”

Dropdown chevron

Several compact developer-tool icons

Right side

Include:

Green status dot

“Ready”

Divider

“GPU: RTX 3060”

Cloud or performance icon

“71%”

Divider

“VRAM: 5.2 / 12GB”

Small utility icon

Match the alignment and low-contrast appearance of the reference.

Layout proportions

Use CSS Grid for the main application shell.

The approximate horizontal structure should be:

Navigation rail: 5%

Left settings panel: 20%

Central workspace: 51%

Right properties panel: 24%

Tune these proportions by comparing the rendered result directly against the reference.

The central workspace should divide approximately as follows:

Large perspective viewport: 60–61%

Orthographic preview column: 39–40%

Within the orthographic column:

Front: full width, approximately 28–29% height

Right: full width, approximately 28–29% height

Bottom row: approximately 42–44% height

Back: 50% width

Left: 50% width

Do not rely only on these percentages. Visually compare against the reference and adjust until the structure matches.

Borders, radii and elevation

Use:

1px low-contrast borders

Approximately 5–7px panel radii

Approximately 3–5px control radii

Very subtle shadows

Restrained inner highlights

Thin separators

Do not use:

Large rounded cards

Heavy drop shadows

Glassmorphism

Bright gradients outside the purple and lime action elements

Thick borders

Excessive blur

Oversized whitespace

This is a dense professional desktop tool.

Icons

Use the closest matching Lucide icons where practical.

Requirements:

Consistent stroke width

Approximately 14–18px sizes

Muted grey default colour

Purple active colour

Carefully aligned with labels

No emoji

No filled cartoon-style icons

If Lucide does not contain a close equivalent, create a simple CSS or SVG icon matching the visual language.

Component architecture

Break the interface into reusable components such as:

AppHeader

NavigationRail

WorkspaceToolbar

ReconstructionPanel

SourceImageCard

SegmentedControl

SliderControl

ToggleSwitch

UploadZone

PerspectiveViewport

OrthographicViewport

ViewportToolStrip

ViewportBottomToolbar

ConsolePanel

ReconstructionProgress

PropertiesPanel

ModelInfoSection

TransformSection

ReconstructionSettings

OutputSettings

StatusBar

Keep static labels and mock data in a dedicated constants or mock-data file where appropriate.

Required interaction behaviour

Although this is frontend-only, visible controls should respond realistically.

Implement:

Active and hover states for navigation items

Selected Solid/Wireframe state

Selected quality state

Selected viewport tool state

Functional toggles

Functional range sliders

Functional dropdown visuals

Expand/collapse behaviour for right-panel sections

Console tab switching

Properties/History tab switching

Change Image button opening a file selector

Drag-and-drop visual state for the upload zone

Reconstruction button triggering a mocked progress sequence

Export button triggering a small non-blocking success notification

Fullscreen viewport control where browser support permits

Tooltips for icon-only controls

Interactions should not alter the default screenshot composition until the user activates them.

Responsive behaviour

The image represents a desktop application. Desktop fidelity is the priority.

For widths between 1280px and 1536px:

Preserve all major panels

Reduce internal gaps and padding slightly

Keep control text readable

Avoid horizontal document scrolling

Allow the left and right panels to scroll internally if necessary

Below 1280px:

Do not force a mobile redesign

Preserve the desktop-tool structure

Allow the full interface to exist in a minimum-width shell with controlled horizontal scrolling

Do not stack the panels vertically

Accessibility

Maintain the appearance while including:

Semantic buttons

Labels for inputs

Keyboard-accessible controls

Visible focus states

ARIA labels for icon-only actions

Sufficient contrast for important text

Reduced-motion support

Focus styles should use a subtle purple outline consistent with the design.

Implementation quality requirements

The result must:

Run without console errors

Use clean TypeScript

Avoid duplicated layout code

Avoid unnecessary dependencies

Avoid inline styles unless required for dynamic values

Use reusable theme tokens

Use maintainable components

Preserve the exact visual hierarchy

Match the reference at the target viewport

Remain stable during resizing

Avoid cumulative layout shift

Avoid placeholder text not found in the reference

Avoid adding marketing content, onboarding, banners or extra features

Visual accuracy workflow

Do not stop after the first implementation.

Use this process:

Inspect the reference image carefully.

Build the complete structural layout.

Run the application.

Capture a screenshot at approximately 1536 × 1024.

Compare the screenshot against the reference.

Correct major dimensional differences first:

Header height

Rail width

Side panel widths

Workspace height

Viewport proportions

Console height

Correct typography, spacing and alignment.

Correct colours, borders and active states.

Correct icon sizes and control styling.

Repeat the screenshot comparison until the implementation is visually close.

Do not declare completion after only creating the components. Validate the rendered page.

Fidelity priorities

If compromises are necessary, use this order of priority:

Overall layout and proportions

Placement and sizing of major panels

3D viewport composition

Typography and spacing

Colours and borders

Controls and interaction states

Exact icon shapes

Secondary responsive behaviour

Important restrictions

Do not:

Change the product name

Replace the interface with a generic admin dashboard

Use the screenshot as one full-page background

omit the console

Omit the orthographic viewports

Omit the bottom status bar

Omit the right-side settings

Convert the design into a light theme

Introduce large cards or excessive spacing

Use random stock imagery

Add charts or analytics not shown

Build backend functionality

Spend time implementing real reconstruction algorithms

Claim pixel accuracy without comparing a rendered screenshot

Definition of done

The task is complete only when:

The page closely matches the attached reference at 1536 × 1024.

Every major visible section from the reference is present.

Panel dimensions and viewport divisions are visually consistent.

The dark colour palette closely matches.

Controls have convincing interactive states.

The application looks like a professional 3D reconstruction desktop tool.

There are no runtime or TypeScript errors.

The interface does not depend on backend services.

A final screenshot comparison has been performed.

Any remaining visual differences are minor and documented.

Begin by examining the attached reference image, inspecting the existing project structure, and identifying the minimum set of files that need to be created or modified. Then implement the complete frontend and visually verify it before finishing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dc3dd031-90ef-4354-a5ae-262d50452d47).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
