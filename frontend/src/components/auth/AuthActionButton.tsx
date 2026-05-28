import type { ButtonHTMLAttributes } from "react";

type AuthActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onAuthenticatedClick?: () => void;
};

export default function AuthActionButton({
  onAuthenticatedClick,
  onClick,
  ...props
}: AuthActionButtonProps) {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    onAuthenticatedClick?.();
  };

  return <button {...props} onClick={handleClick} />;
}
