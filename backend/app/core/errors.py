class AppError(Exception):
    """Base application error."""


class SourceNotFoundError(AppError):
    """Raised when a source ID does not exist."""


class GraphMergeError(AppError):
    """Raised when a graph patch cannot be merged."""
