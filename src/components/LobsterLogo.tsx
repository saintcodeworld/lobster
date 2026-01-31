/* eslint-disable @next/next/no-img-element */
export function LobsterLogo({ className = "w-8 h-8" }: { className?: string, classNamePath?: string }) {
    return (
        <img
            src="/lobster-logo.png"
            alt="Lobster Logo"
            className={className}
        />
    )
}
