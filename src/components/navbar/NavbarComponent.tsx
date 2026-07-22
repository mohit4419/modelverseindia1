import React from 'react';
import Navbar from '../common/Navbar';

export default function NavbarComponent() {
  return <Navbar currentTab="home" setCurrentTab={() => {}} currentRole="client" setCurrentRole={() => {}} isAuthenticated={false} setAuthenticated={() => {}} userEmail="" darkMode={false} onToggleDarkMode={() => {}} isEmailUnverified={false} onResendVerification={() => {}} onChangePassword={() => {}} />;
}
