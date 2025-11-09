import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(500, 'Content must be less than 500 characters'),
});

type PostFormData = z.infer<typeof postSchema>;

export const PostComposer = () => {
  const { isPostComposerOpen, setPostComposerOpen } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Post submitted:', data);
      toast.success('Contribution posted successfully!');
      form.reset();
      setPostComposerOpen(false);
    } catch (error) {
      toast.error('Failed to post contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isPostComposerOpen} onOpenChange={setPostComposerOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Contribution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Share your insights, analysis, or discoveries..."
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">
                      {field.value.length}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPostComposerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
