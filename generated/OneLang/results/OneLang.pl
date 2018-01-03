use strict;
use warnings;

package TokenType;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

our $end_token = "EndToken";
our $whitespace = "Whitespace";
our $identifier = "Identifier";
our $operator_x = "Operator";

package Token;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $value, $is_operator ) = @_;
    $self->{value} = $value;
    $self->{is_operator} = $is_operator;
    return $self;
}

package StringHelper;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub starts_with_at_index {
    my ( $str, $substr, $idx ) = @_;
    return (substr $str, $idx, ($idx + length($substr) - $idx)) eq $substr;
}

package Tokenizer;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $text, $operators ) = @_;
    $self->{text} = $text;
    $self->{operators} = $operators;
    $self->{offset} = 0;
    return $self;
}

sub get_token_type {
    my ( $self ) = @_;
    if ($self->{offset} >= length($self->{text})) {
        return $TokenType::end_token;
    }
    
    my $c = (substr $self->{text}, $self->{offset}, 1);
    return $c eq " " || $c eq "\n" || $c eq "\t" || $c eq "\r" ? $TokenType::whitespace : ("A" le $c && $c le "Z") || ("a" le $c && $c le "z") || ("0" le $c && $c le "9") || $c eq "_" ? $TokenType::identifier : $TokenType::operator_x;
}

sub tokenize {
    my ( $self ) = @_;
    my $result = [];
    
    while ($self->{offset} < length($self->{text})) {
        my $char_type = $self->get_token_type();
        if ($char_type eq $TokenType::whitespace) {
            while ($self->get_token_type() eq $TokenType::whitespace) {
                $self->{offset}++;
            }
        } elsif ($char_type eq $TokenType::identifier) {
            my $start_offset = $self->{offset};
            while ($self->get_token_type() eq $TokenType::identifier) {
                $self->{offset}++;
            }
            my $identifier = (substr $self->{text}, $start_offset, ($self->{offset} - $start_offset));
            push @{$result}, new Token($identifier, 0);
        } else {
            my $op = "";
            foreach my $curr_op (@{$self->{operators}}) {
                if (StringHelper::starts_with_at_index($self->{text}, $curr_op, $self->{offset})) {
                    $op = $curr_op;
                    last;
                }
            }
            if ($op eq "") {
                last;
            }
            $self->{offset} += length($op);
            push @{$result}, new Token($op, 1);
        }
    }
    
    return $result;
}

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."];
    
    my $input = "hello * 5";
    my $tokenizer = new Tokenizer($input, $operators);
    my $result = $tokenizer->tokenize();
    
    print(("token count:") . "\n");
    print((scalar(@{$result})) . "\n");
    foreach my $item (@{$result}) {
        print(($item->{value} . "(" . ($item->{is_operator} ? "op" : "id") . ")") . "\n");
    }
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}