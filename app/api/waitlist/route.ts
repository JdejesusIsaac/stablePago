import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z, ZodError } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

const waitlistSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
  country: z
    .string()
    .max(64)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
  marketingOptIn: z.boolean().default(true),
  signupSource: z.string().max(100).default("landing_page"),
  referralCode: z
    .string()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
  utmSource: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
  utmMedium: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
  utmCampaign: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
});

type WaitlistSignup = z.infer<typeof waitlistSignupSchema>;

// ========================================
// POST - Join Waitlist
// ========================================

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    let supabase;
    try {
      supabase = await createClient();
    } catch (error) {
      console.warn('Supabase not configured for waitlist signup:', error);
      return NextResponse.json({
        success: false,
        message: 'Waitlist signup is temporarily unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE'
      }, { status: 503 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = waitlistSignupSchema.parse(body);
    
    // Get client metadata
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Prepare waitlist entry
    const waitlistEntry = {
      email: validatedData.email.toLowerCase().trim(),
      country: validatedData.country,
      marketing_opt_in: validatedData.marketingOptIn,
      signup_source: validatedData.signupSource,
      utm_source: validatedData.utmSource,
      utm_medium: validatedData.utmMedium,
      utm_campaign: validatedData.utmCampaign,
      referral_code: validatedData.referralCode,
      ip_address: clientIP,
      user_agent: userAgent,
      status: 'active',
      priority_score: calculatePriorityScore(validatedData),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_engaged_at: new Date().toISOString(),
    };

    // Insert into waitlist table
    const { error: waitlistError } = await supabase
      .from('windsurf_waitlist')
      .insert(waitlistEntry)
      .select()
      .single();

    if (waitlistError) {
      console.error('Waitlist insertion error:', waitlistError);
      
      // Handle duplicate email (unique constraint violation)
      if (waitlistError.code === '23505' && (
        waitlistError.message?.includes('email') || 
        waitlistError.message?.includes('windsurf_waitlist_pkey') ||
        waitlistError.details?.includes('email')
      )) {
        // Email already exists - return success message but don't update
        return NextResponse.json({
          success: true,
          message: 'You\'re already on the waitlist! We\'ll notify you about upcoming events.',
          data: { email: waitlistEntry.email, isExisting: true }
        }, { status: 200 });
      }
      
      // Handle RLS policy violations
      if (waitlistError.code === '42501') {
        return NextResponse.json({
          success: false,
          message: 'Waitlist signup is temporarily unavailable. Please contact support.',
          error: 'RLS_POLICY_ERROR',
          details: 'Database permissions need to be configured.'
        }, { status: 500 });
      }
      
      // For other errors, return a generic error message
      return NextResponse.json({
        success: false,
        message: 'Unable to join waitlist at this time. Please try again later.',
        error: 'WAITLIST_ERROR',
        code: waitlistError.code
      }, { status: 500 });
    }

    // Track analytics for new signup
    await trackAnalyticsEvent(supabase, waitlistEntry.email, 'waitlist_signup', {
      signup_source: waitlistEntry.signup_source,
      country: waitlistEntry.country,
      marketing_opt_in: waitlistEntry.marketing_opt_in,
      utm_source: waitlistEntry.utm_source,
      utm_medium: waitlistEntry.utm_medium,
      utm_campaign: waitlistEntry.utm_campaign,
      referral_code: waitlistEntry.referral_code,
    }, clientIP, userAgent);

    // Calculate current position in waitlist
    const { count: waitlistPosition } = await supabase
      .from('windsurf_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('created_at', waitlistEntry.created_at);

    // Send welcome email (integrate with your email service)
    await sendWelcomeEmail(waitlistEntry.email);

    return NextResponse.json({
      success: true,
      message: 'Welcome to the StablePago waitlist! We\'ll keep you updated on launch milestones.',
      data: {
        email: waitlistEntry.email,
        position: waitlistPosition || 1,
        isUpdate: false
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Waitlist signup error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Please check your information and try again.',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// ========================================
// GET - Waitlist Stats (Public)
// ========================================

export async function GET() {
  try {
    // Check if Supabase is configured
    let supabase;
    try {
      supabase = await createClient();
    } catch (error) {
      console.warn('Supabase not configured, returning default stats:', error);
      return NextResponse.json({
        success: true,
        data: {
          totalSignups: 0,
          activeSignups: 0,
          recentSignups: 0,
          topLocations: [],
          message: 'Waitlist stats unavailable - service not configured'
        }
      });
    }
    
    // Get basic waitlist statistics
    const [
      { count: totalSignups },
      { count: activeSignups },
      { count: recentSignups }
    ] = await Promise.all([
      supabase
        .from('windsurf_waitlist')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('windsurf_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('windsurf_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get top locations
    const { data: locationData } = await supabase
      .from('windsurf_waitlist')
      .select('country')
      .eq('status', 'active');

    const countryCounts = (locationData || []).reduce<Record<string, number>>((acc, row: { country: string | null }) => {
      const { country } = row;
      if (!country) return acc;
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const topLocations = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      success: true,
      data: {
        totalSignups: totalSignups || 0,
        activeSignups: activeSignups || 0,
        recentSignups: recentSignups || 0,
        topLocations,
      }
    });

  } catch (error) {
    console.error('Waitlist stats error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch waitlist statistics'
    }, { status: 500 });
  }
}

// ========================================
// PATCH - Update Preferences
// ========================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const updateSchema = z.object({
      email: z.string().email(),
      marketingOptIn: z.boolean().optional(),
      country: z
        .string()
        .max(64)
        .optional()
        .nullable()
        .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
    });

    const validatedData = updateSchema.parse(body);
    const email = validatedData.email.toLowerCase().trim();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.marketingOptIn !== undefined) {
      updateData.marketing_opt_in = validatedData.marketingOptIn;
    }
    if (validatedData.country !== undefined) {
      updateData.country = validatedData.country;
    }

    const { error } = await supabase
      .from('windsurf_waitlist')
      .update(updateData)
      .eq('email', email);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully!'
    });

  } catch (error) {
    console.error('Preference update error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid data provided',
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update preferences'
    }, { status: 500 });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function calculatePriorityScore(data: WaitlistSignup): number {
  let score = 10; // base participation score

  if (data.country) score += 5;
  if (data.marketingOptIn) score += 3;
  if (data.referralCode) score += 10;
  if (data.utmSource) score += 2;
  if (data.utmCampaign) score += 2;

  return score;
}

async function trackAnalyticsEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  eventType: string,
  eventData: Record<string, unknown>,
  ipAddress: string,
  userAgent: string
) {
  try {
    await supabase
      .from('windsurf_waitlist_analytics')
      .insert({
        email,
        event_type: eventType,
        event_data: eventData,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw - analytics failures shouldn't break the main flow
  }
}

async function sendWelcomeEmail(email: string, firstName?: string) {
  // TODO: Integrate with your email service (SendGrid, Resend, etc.)
  // This is a placeholder for email functionality
  try {
    console.log(`Sending welcome email to ${email}${firstName ? ` (${firstName})` : ""}`);
    
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'Windsurf Events <events@windsurf.com>',
    //   to: email,
    //   subject: 'Welcome to Windsurf Vibe Competitions!',
    //   html: `
    //     <h1>Hey ${firstName}! 🎉</h1>
    //     <p>You're now on the waitlist for Windsurf Vibe Competitions.</p>
    //     <p>We'll notify you as soon as the next event is announced!</p>
    //   `
    // });
    
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - email failures shouldn't break signup
  }
}