import Image from "next/image";

const logoUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBBzRoHm01Y5sasxn57-ec75nJ4D3igUyOfjSGWYNuyjYGxP53T_hSL-iwl7VAmPj8Q0g0ZUBVlwbj5tte64BYfVWK6uG7v7GzKOwfJZsNtFPm_70kxZE8vOBfKxwIk_sQ1reBJF6oWvR8aAHrqXA8ZeKeFR0__fufsUtLBlNAuu1JiEgiZ07dMlUd8fnbTSdgekRJGwPW7cQ3mfo0uxEIBJ1ixjqB-OM2cNsHu57fwJ1xzJ_PF-BlEPoL9ZwjMWapWRtLt6DURJ8mj";

export default function BrandHeader() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-32 h-32 flex items-center justify-center mb-4">
        <Image
          src={logoUrl}
          alt="FymenAI Logo"
          width={96}
          height={96}
          className="w-24 h-24 object-contain"
          priority
        />
      </div>
      <h1 className="text-display text-on-surface tracking-tighter">FymenAI</h1>
      <p className="text-body-md text-on-surface-variant mt-1 opacity-60">
        Cognitive focus environment.
      </p>
    </div>
  );
}
