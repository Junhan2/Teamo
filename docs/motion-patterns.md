# Motion Patterns for Dynamic Island Todo

This document outlines the motion patterns and animation techniques used in the Dynamic Island Todo component. These patterns are designed to create a smooth, responsive, and engaging user interface.

## Snappy Transition

The core of our animation is the \`snappyTransition\` object, which defines the spring animation parameters:

\`\`\`javascript
const snappyTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
}
\`\`\`

This transition is used throughout the component to create quick, bouncy animations that feel responsive and lively.

## Expand/Collapse Animation

The main Dynamic Island container uses Framer Motion's \`animate\` prop to smoothly transition between expanded and collapsed states:

\`\`\`jsx
<motion.div
  animate={{
    width: isExpanded ? "var(--di-expanded-width)" : "var(--di-collapsed-width)",
    height: isExpanded ? "auto" : "var(--di-collapsed-height)",
    borderRadius: isExpanded ? "var(--di-expanded-radius)" : "var(--di-border-radius)",
  }}
  transition={{
    ...snappyTransition,
    borderRadius: { duration: 0.08 },
  }}
>
  {/* Content */}
</motion.div>
\`\`\`

The \`borderRadius\` transition is slightly faster to create a snappier feel when expanding/collapsing.

## List Item Animations

Each todo item in the list uses Framer Motion for enter/exit animations:

\`\`\`jsx
<motion.li
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  exit={{ opacity: 0, height: 0 }}
  transition={snappyTransition}
  layout
>
  {/* Todo item content */}
</motion.li>
\`\`\`

The \`layout\` prop ensures smooth transitions when items are reordered or removed.

## AnimatePresence

We use Framer Motion's \`AnimatePresence\` component to handle enter/exit animations for the expanded content and list items:

\`\`\`jsx
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        ...snappyTransition,
        opacity: { duration: 0.1 },
      }}
    >
      {/* Expanded content */}
    </motion.div>
  )}
</AnimatePresence>
\`\`\`

This ensures that exit animations play correctly when elements are removed from the DOM.

## Implementing These Patterns

To implement these motion patterns in your project:

1. Install Framer Motion: \`npm install framer-motion\` or \`yarn add framer-motion\`
2. Import necessary components from Framer Motion:
   \`\`\`javascript
   import { motion, AnimatePresence } from "framer-motion"
   \`\`\`
3. Define the \`snappyTransition\` object in your component.
4. Use \`motion.\` components instead of regular HTML elements for animated elements.
5. Apply the appropriate \`animate\`, \`initial\`, \`exit\`, and \`transition\` props to your motion components.
6. Wrap lists or conditionally rendered elements with \`AnimatePresence\` to handle enter/exit animations.

By following these patterns, you can create a dynamic and engaging user interface with smooth, responsive animations.
\`\`\`
