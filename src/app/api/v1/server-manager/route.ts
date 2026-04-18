import { NextRequest } from 'next/server';
import { handleModuleGet, handleModulePost } from '@/lib/api/controlPanelModuleApi';

const MODULE_ID = 'server-manager';

export async function GET(request: NextRequest) {
  return handleModuleGet(request, MODULE_ID);
}

export async function POST(request: NextRequest) {
  return handleModulePost(request, MODULE_ID);
}
