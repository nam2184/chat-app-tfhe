import * as React from "react";

const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type IconPropType = React.HTMLAttributes<SVGSVGElement> & {
  color?: string;
  size?: number;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  viewBox?: string;
};

// eslint-disable-next-line react/display-name
const Icon = React.forwardRef<
  SVGSVGElement,
  IconPropType & {
    iconNode: React.ReactNode;
  }
>(
  (
    {
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className = "",
      children,
      viewBox = defaultAttributes.viewBox,
      iconNode,
      ...rest
    },
    ref,
  ) => (
    <svg
      ref={ref}
      {...defaultAttributes}
      width={size}
      height={size}
      stroke={color}
      strokeWidth={
        absoluteStrokeWidth ? (Number(strokeWidth) * 24) / size : strokeWidth
      }
      viewBox={viewBox}
      className={className}
      {...rest}
    >
      {iconNode}
      {children}
    </svg>
  ),
);

function createEditorIcon(iconName: string, iconNode: React.ReactNode) {
  const Component = React.forwardRef<SVGSVGElement, IconPropType>(
    ({ className, ...props }, ref) => (
      <Icon ref={ref} iconNode={iconNode} className={className} {...props} />
    ),
  );
  Component.displayName = iconName;
  return Component;
}

export default Icon;
export { createEditorIcon };
