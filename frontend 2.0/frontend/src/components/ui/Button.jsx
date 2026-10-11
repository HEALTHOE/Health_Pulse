import { buttonClasses } from "./buttonStyles";

const Button = ({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...rest
}) => (
  <button
    type={type}
    className={buttonClasses({ variant, size, className })}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
