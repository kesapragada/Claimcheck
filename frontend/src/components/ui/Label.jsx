//CLAIMCHECK/frontend/react/src/components/ui/Label.jsx
import React from 'react';

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300 ${className}`}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };