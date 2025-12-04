import Image from 'next/image';

export function PoweredByCosonas() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 opacity-80">
      <span>Powered by</span>
      <Image
        src="/cosonas-logo.svg"
        alt="Cosonas Ltd"
        width={16}
        height={16}
        className="h-4 w-4"
      />
      <span>Cosonas Ltd</span>
    </div>
  );
}

