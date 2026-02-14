'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemName?: string
  title?: string
  description?: string
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  title = 'هل أنت متأكد من الحذف؟',
  description = 'هذا الإجراء لا يمكن التراجع عنه.',
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {description}{' '}
            {itemName && (
              <>
                سيتم حذف <span className="font-bold text-foreground mx-1">{itemName}</span>.
              </>
            )}
            {' '}هل تريد المتابعة؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="ml-0">إلغاء</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            نعم، احذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
