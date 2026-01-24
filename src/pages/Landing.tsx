import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock,
  Hotel,
  LineChart,
  Sparkles,
  UsersRound,
} from "lucide-react";

import heroImage from "@/assets/landing-hero.jpg";
import analyticsImage from "@/assets/landing-analytics.jpg";
import floorplanImage from "@/assets/landing-floorplan.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg tracking-tight">Bookmytable</div>
              <div className="text-xs text-muted-foreground">Bookings, tables & insights</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/app">Dashboard</Link>
            </Button>
            <Button asChild variant="hero" className="rounded-full">
              <Link to="/auth">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-hero" />
            <div className="absolute inset-0 opacity-25">
              <img src={heroImage} alt="Restaurant table with booking calendar" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-background/70" />
          </div>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1fr] md:items-center md:py-20">
            <div className="space-y-6">
              <Badge className="rounded-full px-4 py-1 text-sm" variant="secondary">
                Built for restaurants, hotels & multi-location teams
              </Badge>

              <h1 className="font-display text-4xl tracking-tight md:text-6xl">
                Bookings, tables, and insights—built for busy service.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Bookmytable helps you manage tables, prevent clashes, and analyze demand by season, month, week, day, and
                hour—so you can staff confidently and maximize revenue.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="hero" className="rounded-full">
                  <Link to="/auth">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/app">View dashboard</Link>
                </Button>
              </div>

              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Peak hours</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="font-display text-2xl tracking-tight">At a glance</div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Seasonality</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="font-display text-2xl tracking-tight">Month / Week</div>
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Team-ready</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="font-display text-2xl tracking-tight">Multi-location</div>
                    <UsersRound className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
              <div className="grid gap-4">
                <Card className="overflow-hidden rounded-[2rem] shadow-card">
                  <div className="aspect-[16/10]">
                    <img
                      src={analyticsImage}
                      alt="Booking analytics dashboard with charts"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="shadow-card">
                    <CardContent className="flex items-center justify-between gap-3 p-5">
                      <div>
                        <div className="text-xs text-muted-foreground">Peak hour</div>
                        <div className="mt-1 font-display text-2xl tracking-tight">19:00</div>
                      </div>
                      <LineChart className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardContent className="flex items-center justify-between gap-3 p-5">
                      <div>
                        <div className="text-xs text-muted-foreground">Busiest day</div>
                        <div className="mt-1 font-display text-2xl tracking-tight">Friday</div>
                      </div>
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual proof: table management */}
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <Badge className="rounded-full" variant="secondary">
                Table control
              </Badge>
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                A clearer floor plan = fewer mistakes in service.
              </h2>
              <p className="text-muted-foreground">
                See what’s free, what’s booked, and what’s coming soon—then drill into a table to view today’s bookings.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/app">
                  Explore the dashboard <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Card className="overflow-hidden rounded-[2rem] shadow-card">
              <div className="aspect-[16/10]">
                <img
                  src={floorplanImage}
                  alt="Restaurant floor plan showing table layout"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <div className="space-y-3">
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">Everything you need to run bookings like a pro</h2>
              <p className="text-muted-foreground">
                From table-level visibility to seasonality insights—Bookmytable helps restaurants and hotels operate smoother
                and learn faster.
              </p>
            </div>
            <div className="flex justify-start md:justify-end">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  Analytics that matter
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Track bookings by season, month, week, day of week, and hour of day. Spot peaks, plan staffing, and reduce
                bottlenecks.
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <Hotel className="h-5 w-5" />
                  </span>
                  Built for hospitality
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Perfect for restaurants, hotel dining rooms, and multi-location groups—keep teams aligned with a single,
                simple dashboard.
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  Fast daily workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Visual table status, quick booking, and a clean “what’s happening today” view—so staff can focus on guests,
                not spreadsheets.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social proof */}
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="grid gap-6 rounded-[2rem] border bg-muted/30 p-6 shadow-card md:grid-cols-3 md:p-10">
            <div className="md:col-span-1">
              <h2 className="font-display text-3xl tracking-tight">Teams love the clarity.</h2>
              <p className="mt-2 text-muted-foreground">
                Faster handovers, fewer double bookings, and decisions backed by real demand patterns.
              </p>
            </div>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    “We finally know our true peak hours by day—and staffing is so much easier.”
                  </p>
                  <div className="mt-4 text-sm font-medium">Operations Manager</div>
                  <div className="text-xs text-muted-foreground">Boutique Hotel Dining</div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    “Table status is instantly readable. We’ve reduced booking mistakes during rush.”
                  </p>
                  <div className="mt-4 text-sm font-medium">Restaurant Owner</div>
                  <div className="text-xs text-muted-foreground">80-seat Restaurant</div>
                </CardContent>
              </Card>
              <Card className="shadow-card md:col-span-2">
                <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Multi-location ready</div>
                    <div className="font-display text-2xl tracking-tight">Standardize bookings across venues</div>
                  </div>
                  <Button asChild variant="hero" className="rounded-full">
                    <Link to="/auth">Start free</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div className="space-y-3">
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">Why Bookmytable?</h2>
              <p className="text-muted-foreground">
                A lightweight, modern booking command center—designed for speed, clarity, and better planning.
              </p>
              <div className="pt-2">
                <Button asChild variant="hero" className="rounded-full">
                  <Link to="/auth">Start free</Link>
                </Button>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Can each restaurant/hotel only see its own data?</AccordionTrigger>
                <AccordionContent>
                  Yes—data is isolated per restaurant using strict Row Level Security, so teams only access their own tables
                  and reservations.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can we analyze bookings by season, month, week, and hour?</AccordionTrigger>
                <AccordionContent>
                  Yes—use the Analytics tab to understand trends across time (peak hours, busiest days, and more) and make
                  smarter staffing and capacity decisions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is this suitable for multi-location groups?</AccordionTrigger>
                <AccordionContent>
                  Yes—Bookmytable is designed to scale from single venues to multi-location operations with role-based
                  access via restaurant memberships.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Bookmytable</span> — built for hospitality teams.
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/app">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
