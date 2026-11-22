from abc import ABC, abstractmethod
from typing import Dict, Any


class BasePromptTemplate(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the template/strategy."""
        pass

    @abstractmethod
    def get_structure_guidelines(self, length: str) -> str:
        """Specific structural guidelines for this content format and target length."""
        pass

    @abstractmethod
    def get_formatting_rules(self) -> str:
        """Formatting, headline, markdown, or social tag instructions."""
        pass
