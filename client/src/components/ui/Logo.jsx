import React from 'react';
import logo from '../../public/logo/logo.jpg';

export function Logo({ className = 'w-8 h-8' }) {
  return <img src={logo} alt="Logo Z176" className={`${className} object-contain rounded-lg`} />;
}