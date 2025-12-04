import Image from 'next/image';

export function PoweredByCosonas() {
  return (
    <a
      href="https://cosonas.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[11px] text-gray-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
    >
      <span>Powered by</span>
      <Image
        src="/cosonas-logo.svg"
        alt="Cosonas Ltd"
        width={16}
        height={16}
        className="h-4 w-4"
      />
      <span>Cosonas Ltd</span>
    </a>
  );
}

