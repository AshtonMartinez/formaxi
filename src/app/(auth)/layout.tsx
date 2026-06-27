function FormaxiLogo() {
  return (
    <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-[0_4px_16px_rgba(52,224,127,0.3)]">
      <div className="h-[20px] w-[20px] rounded-full border-[2.4px] border-[#07140c]" />
      <div className="absolute h-[20px] w-[2.4px] bg-[#07140c]" />
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <FormaxiLogo />
        <div>
          <div className="font-heading text-[22px] font-black leading-none tracking-[-0.5px]">
            FormaXI
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-dim mt-0.5">
            Football League Manager
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
