import { FormEvent, useEffect, useState } from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const Contact = () => {
  usePageMetadata({
    title: "Contact — NOP Intelligence Layer",
    description:
      "Get in touch with the NOP Intelligence Layer team for partnerships, security reports, and community support.",
  });

  const [form, setForm] = useState<ContactFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [reporterId, setReporterId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setReporterId(data.user?.id ?? null);
      }
    };

    void loadUser();
  }, []);

  const handleChange = (key: keyof ContactFormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.message.trim()) {
      toast.error("Please add a message.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        subject: form.subject.trim() || null,
        message: form.message.trim(),
        reporter_id: reporterId,
      };

      const { error } = await supabase.from("contact_messages").insert(payload);
      if (error) throw error;

      toast.success("Message received. We will respond shortly.");
      setForm(initialState);
    } catch (error) {
      console.error("CONTACT_FORM_SUBMIT", error);
      toast.error("We could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold text-text-primary">Contact</h1>
            <p className="leading-relaxed text-text-secondary">
            Reach the NOP Intelligence Layer core team for partnerships, press enquiries, and protocol
            support. We aim to respond within 72 hours.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
            <form
              className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card-soft"
              onSubmit={handleSubmit}
            >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(event) => handleChange("name")(event.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => handleChange("email")(event.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                placeholder="How can we help?"
                value={form.subject}
                onChange={(event) => handleChange("subject")(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                placeholder="Share your request, feedback, or report…"
                rows={6}
                value={form.message}
                onChange={(event) => handleChange("message")(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto"
            >
              {submitting ? "Sending…" : "Send message"}
            </Button>

              <p className="text-xs leading-relaxed text-text-secondary">
              We log submissions securely in Supabase under{" "}
                <code className="rounded bg-surface-muted px-1 py-0.5 text-[11px] text-text-primary">
                contact_messages
              </code>{" "}
              with optional linkage to your authenticated profile.
            </p>
          </form>

            <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card-soft leading-relaxed text-text-secondary">
            <div>
                <h2 className="text-lg font-semibold text-text-primary">Direct Email</h2>
              <p className="mt-2">
                Prefer your own client? Write to{" "}
                <a
                  href="mailto:hello@nopintelligencelayer.xyz"
                    className="font-semibold text-text-primary transition hover:underline"
                >
                  hello@nopintelligencelayer.xyz
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Knowledge Base</h2>
            <p className="mt-2">A refreshed self-serve FAQ and incident history launches shortly.</p>
          </div>
        </aside>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Contact;
