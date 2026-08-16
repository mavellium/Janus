import Image from 'next/image'

export function AuthLogo() {
  return (
    <div className="relative inline-flex items-center justify-center w-10 h-10 mb-4">
      <Image
        src="/logo-min.svg"
        alt="Janus"
        width={40}
        height={40}
        priority
        className="dark:hidden"
      />
      <Image
        src="/janus-logo-min-white.svg"
        alt="Janus"
        width={40}
        height={40}
        priority
        className="hidden dark:block"
      />
    </div>
  )
}
