// @ts-nocheck
'use client';

import React from 'react';
import DeveloperErrorPage from './error';

const DeveloperNotFoundPage = () => {
  return (
    <DeveloperErrorPage 
      notFound={true}
      error={new Error('404 - Page not found')}
    />
  );
};

export default DeveloperNotFoundPage;
