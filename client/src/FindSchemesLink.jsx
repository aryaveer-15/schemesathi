import { Link, NavLink } from 'react-router-dom';

function preloadOnTouch(event) {
  if (event.pointerType !== 'touch') return;
  // A failed hint must leave navigation and its normal error handling available.
  import('./pages/FindSchemes.jsx').catch(() => {});
}

export default function FindSchemesLink({ navigation = false, ...props }) {
  const Component = navigation ? NavLink : Link;
  return <Component {...props} to="/my-schemes" onPointerDown={preloadOnTouch} />;
}
