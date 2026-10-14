/** Marca de Radical Gym: emblema dorado en círculo blanco y "RADICAL" en blanco espaciado. */
export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <img src="/logo-emblema.png" alt="Radical Gym" className="w-10 h-10 object-contain shrink-0" />
      {!compacto && (
        <span className="text-[17px] font-medium tracking-[0.32em] text-white leading-none">RADICAL</span>
      )}
    </div>
  );
}

/** Logo completo (emblema sobre el nombre) para la pantalla de ingreso. */
export function LogoCompleto({ className = 'w-56' }: { className?: string }) {
  return <img src="/logo-completo.png" alt="Radical Gym" className={`${className} object-contain select-none`} />;
}
