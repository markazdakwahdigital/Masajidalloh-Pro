import { NextResponse } from 'next/server';
/** Liveness only: does not expose credentials or claim database readiness. */
export function GET() {
  return NextResponse.json({status:'ok',service:'masajidalloh-pro',check:'liveness'});
}
