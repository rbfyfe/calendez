import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConfirmedPageProps {
  searchParams: Promise<{
    name?: string;
    date?: string;
    time?: string;
    duration?: string;
    title?: string;
  }>;
}

export default async function ConfirmedPage({
  searchParams,
}: ConfirmedPageProps) {
  const params = await searchParams;
  const { name, date, time, duration, title } = params;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>

        {name && (
          <p className="text-gray-600 mb-4">
            Thanks, {name}! You&apos;re all set.
          </p>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
          {title && (
            <div>
              <span className="text-sm text-gray-500">Meeting</span>
              <p className="font-medium">{title}</p>
            </div>
          )}
          {date && (
            <div>
              <span className="text-sm text-gray-500">Date</span>
              <p className="font-medium">{date}</p>
            </div>
          )}
          {time && (
            <div>
              <span className="text-sm text-gray-500">Time</span>
              <p className="font-medium">{time}</p>
            </div>
          )}
          {duration && (
            <div>
              <span className="text-sm text-gray-500">Duration</span>
              <p className="font-medium">{duration} minutes</p>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          A calendar invitation has been sent to your email. You&apos;ll find
          all the meeting details there.
        </p>

        <Link href="/">
          <Button variant="outline" className="w-full">
            Book Another Meeting
          </Button>
        </Link>
      </Card>
    </div>
  );
}
