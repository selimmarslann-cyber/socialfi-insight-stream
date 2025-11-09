import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, ImagePlus, Trash2 } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);

  const handleOpenChange = (open: boolean) => {
    setPostComposerOpen(open);
    if (!open) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Post submitted:', {
        ...data,
        hasImage: Boolean(imageFile),
      });
      toast.success('Contribution posted successfully!');
      handleOpenChange(false);
    } catch (error) {
      toast.error('Failed to post contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isPostComposerOpen} onOpenChange={handleOpenChange}>
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
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <span className="text-xs text-muted-foreground">
                        {field.value.length}/500
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4" />
                        Add image
                      </Button>
                      {imageFile && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {imageFile.name}
                          </span>
                        </>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="relative w-full overflow-hidden rounded-lg border bg-muted/20">
                        <img
                          src={imagePreview}
                          alt="Selected contribution visual"
                          className="w-full object-cover max-h-64"
                        />
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
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
