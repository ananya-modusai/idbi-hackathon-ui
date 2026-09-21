'use client';

import { FC } from 'react';
import Image from 'next/image';
import kotakLogo from '../assets/kotak-logo.svg';

interface ClientLogoProps {
  className?: string;
  logoHeight: number;
}

const ClientLogo: FC<ClientLogoProps> = ({ className = "", logoHeight }) => {
  // Calculate width based on height to maintain aspect ratio (kotak logo is ~578x173, ~3.34:1)
  const logoWidth = logoHeight * 3.34;

  return (
    <Image
      src={kotakLogo}
      alt="Kotak Mahindra Bank Logo"
      width={logoWidth}
      height={logoHeight}
      className={`object-contain ${className}`}
      style={{ height: `${logoHeight}px` }}
      priority
    />
  );
};

export default ClientLogo;
