class AppError(Exception):
    """Base application error."""


class SourceNotFoundError(AppError):
    """Raised when a source ID does not exist."""


class SourceFetchError(AppError):
    """Raised when a configured source provider cannot fetch source data."""


class GraphMergeError(AppError):
    """Raised when a graph patch cannot be merged."""


class AIExtractionError(AppError):
    """Raised when an extraction provider cannot produce graph data."""


class AIResponseValidationError(AppError):
    """Raised when extracted graph data fails validation."""
