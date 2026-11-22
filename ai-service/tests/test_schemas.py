import pytest
from pydantic import ValidationError
from app.domain.models import ContentType, Tone, ContentLength, RefineAction
from app.schemas.requests import GenerateRequest, RefineRequest, VariationsRequest


def test_valid_generate_request_all_fields():
    req = GenerateRequest(
        title="Valid Title",
        contentType=ContentType.BLOG,
        tone=Tone.INFORMATIVE,
        length=ContentLength.MEDIUM,
        targetAudience="Engineers",
        keywords=["AI", "Python"],
        context="Some context",
        referenceText="Reference notes",
    )
    assert req.title == "Valid Title"
    assert req.contentType == ContentType.BLOG
    assert len(req.keywords) == 2


def test_generate_request_rejects_empty_title():
    with pytest.raises(ValidationError):
        GenerateRequest(
            title="",
            contentType=ContentType.BLOG,
            tone=Tone.INFORMATIVE,
            length=ContentLength.MEDIUM,
        )


def test_generate_request_rejects_too_many_keywords():
    with pytest.raises(ValidationError):
        GenerateRequest(
            title="Topic",
            contentType=ContentType.BLOG,
            tone=Tone.INFORMATIVE,
            length=ContentLength.MEDIUM,
            keywords=[f"kw{i}" for i in range(25)],  # max is 15
        )


def test_valid_refine_request_all_actions():
    for action in RefineAction:
        req = RefineRequest(
            content="Sample text",
            action=action,
            instruction="Make it sharp",
        )
        assert req.action == action


def test_refine_request_rejects_empty_content():
    with pytest.raises(ValidationError):
        RefineRequest(
            content="",
            action=RefineAction.SIMPLIFY,
        )


def test_variations_count_boundaries():
    # Valid count 1, 2, 3
    assert VariationsRequest(title="T", content="C", contentType="blog", tone="casual", count=1).count == 1
    assert VariationsRequest(title="T", content="C", contentType="blog", tone="casual", count=3).count == 3

    # Invalid: 0
    with pytest.raises(ValidationError):
        VariationsRequest(title="T", content="C", contentType="blog", tone="casual", count=0)

    # Invalid: 4
    with pytest.raises(ValidationError):
        VariationsRequest(title="T", content="C", contentType="blog", tone="casual", count=4)


def test_tone_enum_completeness():
    valid_tones = [t.value for t in Tone]
    assert "professional" in valid_tones
    assert "casual" in valid_tones
    assert "friendly" in valid_tones
    assert "persuasive" in valid_tones
    assert "informative" in valid_tones
    assert "creative" in valid_tones
    assert "humorous" in valid_tones
    assert "academic" in valid_tones


def test_content_length_enum_completeness():
    valid_lengths = [l.value for l in ContentLength]
    assert "short" in valid_lengths
    assert "medium" in valid_lengths
    assert "long" in valid_lengths


def test_generate_request_rejects_excessive_title_length():
    with pytest.raises(ValidationError):
        GenerateRequest(
            title="A" * 201,  # exceeds 200 max length
            contentType=ContentType.BLOG,
            tone=Tone.INFORMATIVE,
            length=ContentLength.MEDIUM,
        )


def test_refine_request_rejects_invalid_action():
    with pytest.raises(ValidationError):
        RefineRequest(
            content="Some text to refine",
            action="non_existent_action",  # not a valid RefineAction enum
        )

