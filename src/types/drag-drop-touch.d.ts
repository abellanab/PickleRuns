// drag-drop-touch ships no type declarations. It is a side-effecting polyfill —
// importing it instantiates a singleton that translates touch events into HTML5
// drag events. We only ever import it for that side effect, so an empty module
// declaration is all the type system needs.
declare module "drag-drop-touch";
