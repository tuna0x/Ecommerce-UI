import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from './ConfirmModal'

describe('ConfirmModal Component', () => {
  it('renders trigger button and opens modal on click', async () => {
    const onConfirmMock = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmModal
        title="Xóa đơn hàng"
        description="Bạn có thực sự muốn xóa?"
        onConfirm={onConfirmMock}
        confirmText="Đồng ý"
        cancelText="Hủy bỏ"
      >
        <button data-testid="trigger-btn">Mở Modal</button>
      </ConfirmModal>
    )

    // Verify trigger is in the document
    const triggerBtn = screen.getByTestId('trigger-btn')
    expect(triggerBtn).toBeInTheDocument()

    // Title and description should not be visible initially
    expect(screen.queryByText('Xóa đơn hàng')).not.toBeInTheDocument()

    // Click trigger to open modal
    await user.click(triggerBtn)

    // Now modal title and description should be visible
    expect(screen.getByText('Xóa đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Bạn có thực sự muốn xóa?')).toBeInTheDocument()

    // Click confirm button
    const confirmBtn = screen.getByRole('button', { name: 'Đồng ý' })
    await user.click(confirmBtn)

    // Expect callback to be called
    expect(onConfirmMock).toHaveBeenCalledTimes(1)
  })
})
