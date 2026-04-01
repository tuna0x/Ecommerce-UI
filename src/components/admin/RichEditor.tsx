import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    ImageIcon, 
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Strikethrough,
    Link as LinkIcon,
    Code,
    Quote,
    Type,
    Eraser
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ 
    value, 
    onChange, 
    placeholder = 'Nhập nội dung...', 
    className 
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl shadow-lg my-6 max-w-full mx-auto',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[300px] p-6 focus:outline-none prose prose-pink max-w-none dark:prose-invert prose-img:rounded-2xl prose-img:shadow-xl prose-img:mx-auto prose-headings:font-bold prose-p:leading-relaxed",
                ),
            },
        },
    });

    // Sync content when value changes externally (but not when updated from within)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Nhập URL liên kết:', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Nhập URL hình ảnh:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className={cn(
            "border rounded-2xl bg-background transition-all duration-300 overflow-hidden shadow-sm group",
            editor.isFocused ? "ring-2 ring-primary/20 border-primary shadow-md" : "border-input",
            className
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/20 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-1 mr-2 px-1">
                    <EditorButton 
                        icon={Heading1} 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                        active={editor.isActive('heading', { level: 1 })}
                        title="Tiêu đề 1" 
                    />
                    <EditorButton 
                        icon={Heading2} 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                        active={editor.isActive('heading', { level: 2 })}
                        title="Tiêu đề 2" 
                    />
                    <EditorButton 
                        icon={Heading3} 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
                        active={editor.isActive('heading', { level: 3 })}
                        title="Tiêu đề 3" 
                    />
                    <EditorButton 
                        icon={Type} 
                        onClick={() => editor.chain().focus().setParagraph().run()} 
                        active={editor.isActive('paragraph')}
                        title="Văn bản thường" 
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1 opacity-50" />

                <div className="flex items-center gap-1 px-1">
                    <EditorButton 
                        icon={Bold} 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        active={editor.isActive('bold')}
                        title="In đậm" 
                    />
                    <EditorButton 
                        icon={Italic} 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        active={editor.isActive('italic')}
                        title="In nghiêng" 
                    />
                    <EditorButton 
                        icon={Strikethrough} 
                        onClick={() => editor.chain().focus().toggleStrike().run()} 
                        active={editor.isActive('strike')}
                        title="Gạch ngang" 
                    />
                    <EditorButton 
                        icon={Code} 
                        onClick={() => editor.chain().focus().toggleCode().run()} 
                        active={editor.isActive('code')}
                        title="Mã code" 
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1 opacity-50" />

                <div className="flex items-center gap-1 px-1">
                    <EditorButton 
                        icon={List} 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        active={editor.isActive('bulletList')}
                        title="Danh sách" 
                    />
                    <EditorButton 
                        icon={ListOrdered} 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                        active={editor.isActive('orderedList')}
                        title="Danh sách số" 
                    />
                    <EditorButton 
                        icon={Quote} 
                        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                        active={editor.isActive('blockquote')}
                        title="Trích dẫn" 
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1 opacity-50" />

                <div className="flex items-center gap-1 px-1">
                    <EditorButton 
                        icon={LinkIcon} 
                        onClick={setLink} 
                        active={editor.isActive('link')}
                        title="Gắn link" 
                    />
                    <EditorButton 
                        icon={ImageIcon} 
                        onClick={addImage} 
                        title="Chèn ảnh" 
                    />
                     <EditorButton 
                        icon={Eraser} 
                        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
                        title="Xóa định dạng" 
                    />
                </div>

                <div className="flex-1" />
                
                <div className="flex items-center gap-1 px-1">
                    <EditorButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác" />
                    <EditorButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} title="Làm lại" />
                </div>
            </div>

            {/* Editable Area */}
            <div className="relative cursor-text">
                <EditorContent editor={editor} />
                {editor.isEmpty && (
                     <div className="absolute top-6 left-6 text-muted-foreground/40 pointer-events-none select-none italic text-sm">
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="px-4 py-1.5 bg-muted/10 border-t border-border flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                    Rich Editor Pro
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                    {editor.storage.characterCount?.characters?.() || 0} ký tự
                </div>
            </div>
        </div>
    );
};

interface EditorButtonProps {
    icon: React.ElementType;
    onClick: () => void;
    title: string;
    active?: boolean;
}

const EditorButton: React.FC<EditorButtonProps> = ({ icon: Icon, onClick, title, active }) => (
    <Button
        type="button"
        variant={active ? "secondary" : "ghost"}
        size="sm"
        className={cn(
            "h-8 w-8 p-0 rounded-md transition-all duration-200",
            active 
                ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
        )}
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        title={title}
    >
        <Icon className="h-4 w-4" />
    </Button>
);

export default RichEditor;
