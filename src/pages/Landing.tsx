import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, Clock, Hotel, Sparkles, UsersRound } from "lucide-react";

import heroImage from "@/assets/bookmytable-hero.png";
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
            <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(60%_55%_at_50%_20%,black,transparent)]">
              <img
                src={heroImage}
                alt="Restaurant table setting"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
            <div className="space-y-6">
              <Badge className="rounded-full px-4 py-1 text-sm" variant="secondary">
                Built for restaurants, hotels & multi-location teams
              </Badge>

              <h1 className="font-display text-4xl tracking-tight md:text-6xl">
                Turn every booking into a smoother service—and smarter decisions.
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
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
              <Card className="overflow-hidden rounded-[2rem] shadow-card">
                <div className="aspect-[4/3]">
                  <img
                    src={heroImage}
                    alt="A welcoming dining setup with plates and cutlery"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-xl tracking-tight">Today’s demand</div>
                    <Badge className="rounded-full" variant="secondary">
                      Live view
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground">Most booked day</div>
                      <div className="mt-1 font-display text-2xl tracking-tight">Friday</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground">Peak hour</div>
                      <div className="mt-1 font-display text-2xl tracking-tight">19:00</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Your real dashboard calculates these from actual bookings.
                  </div>
                </CardContent>
              </Card>
            </div>
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
