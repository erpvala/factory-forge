// @ts-nocheck
import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

export default function LegacyProductRedirect() {
  const { productId, id } = useParams();
  const location = useLocation();
  const resolved = productId || id;

  if (!resolved) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <Navigate
      to={`/marketplace/product/${encodeURIComponent(decodeURIComponent(resolved))}${location.search}${location.hash}`}
      replace
    />
  );
}
