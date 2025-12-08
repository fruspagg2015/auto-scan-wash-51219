import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProcessingModal } from './ProcessingModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { idplaca: 123 }, error: null })
                }))
            }))
        }))
    }
}));

// Mock UI components to simplify testing
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
    Loader2: () => <div>Icon</div>,
    Camera: () => <div>Icon</div>,
    Database: () => <div>Icon</div>,
    Globe: () => <div>Icon</div>,
    UserPlus: () => <div>Icon</div>,
    CheckCircle: () => <div>Icon</div>,
}));

describe('ProcessingModal', () => {
    const mockOnComplete = vi.fn();
    const mockOnCancel = vi.fn();
    const mockOnRequestClientData = vi.fn();
    const mockCapturedImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/igAoAKACgD/2Q==';

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('should send image to external API when processing starts', async () => {
        // Mock successful API response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                veiculo: {
                    placa: 'ABC1234',
                    marca: 'Toyota',
                    modelo: 'Corolla'
                }
            })
        });

        render(
            <ProcessingModal
                isOpen={true}
                onComplete={mockOnComplete}
                onCancel={mockOnCancel}
                capturedImage={mockCapturedImage}
                onRequestClientData={mockOnRequestClientData}
            />
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'https://n8n03.frconnect.com.br/webhook-test/frsend.consultar.placa',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'image/jpeg'
                    }),
                    body: expect.any(Blob)
                })
            );
        });

        // Verify Body content
        const call = (global.fetch as any).mock.calls[0];
        const body = call[1].body as Blob;
        expect(body).toBeInstanceOf(Blob);
        expect(body.type).toBe('image/jpeg');
    });
});
