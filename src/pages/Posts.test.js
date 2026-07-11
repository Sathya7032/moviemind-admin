import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Posts from './Posts';
import * as postService from '../services/postService';

jest.mock('../services/postService', () => ({
  getAllPosts: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows post details and comments in a popup', async () => {
    postService.getAllPosts.mockResolvedValue({
      success: true,
      data: {
        totalElements: 1,
        totalPages: 1,
        size: 10,
        content: [
          {
            id: 42,
            postType: 'POST',
            author: 'Alice',
            authorSubtitle: 'Admin',
            description: 'Hello world',
            imageUrl: '',
            options: [],
            likesCount: 2,
            commentsCount: 1,
            likedByMe: false,
            createdTime: '2026-07-11T10:51:31.810Z',
            updatedTime: '2026-07-11T10:51:31.810Z',
            comments: [{ id: 7, text: 'Nice post' }],
          },
        ],
      },
    });

    render(<Posts />);

    expect(await screen.findByText('Posts & Polls')).toBeInTheDocument();
    expect(await screen.findByText(/Total posts/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /view details/i }));

    expect(await screen.findByText('Post Details')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Nice post')).toBeInTheDocument();
  });
});
