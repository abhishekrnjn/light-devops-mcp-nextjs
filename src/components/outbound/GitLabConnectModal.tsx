'use client';

import { useState } from 'react';
import { Descope } from '@descope/nextjs-sdk';

interface GitLabConnectModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function GitLabConnectModal({ onSuccess, onClose }: GitLabConnectModalProps) {
  const handleSuccess = (e: any) => {
    console.log('GitLab step-up authentication successful!');
    console.log('User name:', e.detail.user.name);
    console.log('User email:', e.detail.user.email);
    
    onSuccess();
  };

  const handleError = (err: any) => {
    console.error('GitLab step-up authentication error:', err);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">🦊</span>
            <h2 className="text-xl font-semibold text-gray-900">
              Connect to GitLab
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            Authorize access to your GitLab repositories and DevOps features.
          </p>
        </div>

        {/* Descope Step-up Flow - Direct Display */}
        <div className="min-h-[400px]">
          <Descope
            flowId="step-up"
            theme="light"
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}
