class ModelNotAvailableError(Exception):
    """Raised when the fraud detection model is not loaded or ready."""


class DataSourceNotFoundError(Exception):
    """Raised when the data source (e.g., PaySim CSV) cannot be found."""


class TransactionNotFoundError(Exception):
    """Raised when a requested transaction does not exist."""
