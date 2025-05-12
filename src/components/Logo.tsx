import React from 'react';
import Image from 'next/image';

export default function Logo() {
  return (
    <div className="logo-wrapper">
      <Image
        src={require('../../public/images/catalyst-logo-1-black.png')}
        alt="Catalyst by Intuitiv Labs logo"
        width={320}
        height={96}
        className="logo-light"
        priority
        style={{ objectFit: 'contain', display: 'block' }}
      />
      <Image
        src={require('../../public/images/catalyst-logo-1-white.png')}
        alt="Catalyst by Intuitiv Labs logo (white)"
        width={320}
        height={96}
        className="logo-dark"
        priority
        style={{ objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}
