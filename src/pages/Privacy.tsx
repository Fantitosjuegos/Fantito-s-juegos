import React from 'react';

const Privacy = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto text-foreground">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: June 30, 2026</p>
      <p className="mb-4">
        Fantito's Juegos respects your privacy. We only collect the information 
        necessary to provide you with a personalized game experience.
      </p>
      <h2 className="text-xl font-bold mt-6 mb-2">Data We Collect</h2>
      <p className="mb-4">
        We collect your email address and profile information via Google OAuth 
        to manage your account and game history.
      </p>
      <h2 className="text-xl font-bold mt-6 mb-2">How We Use Data</h2>
      <p className="mb-4">
        Your data is used solely to generate game content and maintain your 
        session. We do not sell or share your data with third parties.
      </p>
    </div>
  );
};

export default Privacy;